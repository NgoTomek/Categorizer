import os
import boto3
import json
import base64
import time
import hmac
import hashlib
import io
import tempfile
from typing import List, Dict, Any, Optional
from jose import jwk, jwt
from jose.utils import base64url_decode
import requests
from PyPDF2 import PdfReader, PdfWriter


def validate_jwt(token: str, user_pool_id: str) -> Optional[Dict[str, Any]]:
    """
    Validate a JWT token from Cognito
    
    Args:
        token: JWT token string
        user_pool_id: Cognito User Pool ID
        
    Returns:
        Dictionary containing the JWT claims if valid, None otherwise
    """
    # Fetch Cognito's public keys
    region = user_pool_id.split('_')[0]
    keys_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
    
    try:
        response = requests.get(keys_url)
        keys = response.json()['keys']
    except Exception as e:
        print(f"Error fetching Cognito public keys: {str(e)}")
        return None
    
    # Get the kid from the headers
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    
    # Find the key matching the kid
    key = None
    for k in keys:
        if k['kid'] == kid:
            key = k
            break
    
    if not key:
        print(f"Public key with kid {kid} not found")
        return None
    
    # Verify the signature
    try:
        # Convert the public key to PEM format
        public_key = jwk.construct(key)
        
        # Get message and signature from token
        message, encoded_signature = token.rsplit('.', 1)
        decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
        
        # Verify signature
        if not public_key.verify(message.encode('utf-8'), decoded_signature):
            print("Signature verification failed")
            return None
        
        # Verify claims
        claims = jwt.get_unverified_claims(token)
        
        # Check expiration time
        if time.time() > claims['exp']:
            print("Token has expired")
            return None
        
        # Check audience
        if 'aud' in claims and claims['aud'] != 'your-client-id':
            print("Token was not issued for this audience")
            return None
        
        return claims
        
    except Exception as e:
        print(f"Error validating token: {str(e)}")
        return None


def get_cognito_tokens(username: str, password: str, user_pool_id: str, client_id: str) -> Dict[str, Any]:
    """
    Get JWT tokens from Cognito using the Secure Remote Password (SRP) protocol
    
    Args:
        username: User's username or email
        password: User's password
        user_pool_id: Cognito User Pool ID
        client_id: Cognito User Pool Client ID
        
    Returns:
        Dictionary containing the tokens
    """
    client = boto3.client('cognito-idp')
    
    try:
        auth_response = client.admin_initiate_auth(
            UserPoolId=user_pool_id,
            ClientId=client_id,
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        
        auth_result = auth_response['AuthenticationResult']
        
        return {
            'AccessToken': auth_result['AccessToken'],
            'IdToken': auth_result['IdToken'],
            'RefreshToken': auth_result['RefreshToken'],
            'ExpiresIn': auth_result['ExpiresIn']
        }
        
    except client.exceptions.NotAuthorizedException:
        raise Exception("Incorrect username or password")
    
    except client.exceptions.UserNotFoundException:
        raise Exception("User does not exist")
    
    except Exception as e:
        raise Exception(f"Authentication error: {str(e)}")


def list_s3_folders(bucket: str, prefix: str) -> List[str]:
    """
    List folders in an S3 bucket
    
    Args:
        bucket: S3 bucket name
        prefix: Prefix to filter objects by
        
    Returns:
        List of folder names
    """
    s3_client = boto3.client('s3')
    
    response = s3_client.list_objects_v2(
        Bucket=bucket,
        Prefix=prefix,
        Delimiter='/'
    )
    
    folders = []
    
    # Extract folder names from CommonPrefixes
    if 'CommonPrefixes' in response:
        for common_prefix in response['CommonPrefixes']:
            folder_path = common_prefix['Prefix']
            
            # Remove the trailing slash and the prefix to get the folder name
            folder_name = folder_path.rstrip('/').replace(prefix, '')
            
            if folder_name:
                folders.append(folder_name)
    
    return folders


def list_s3_files(bucket: str, prefix: str, suffix: str = "") -> List[str]:
    """
    List files in an S3 bucket with optional suffix filter
    
    Args:
        bucket: S3 bucket name
        prefix: Prefix to filter objects by
        suffix: Optional suffix to filter objects by
        
    Returns:
        List of file names
    """
    s3_client = boto3.client('s3')
    
    response = s3_client.list_objects_v2(
        Bucket=bucket,
        Prefix=prefix
    )
    
    files = []
    
    # Extract file names from Contents
    if 'Contents' in response:
        for item in response['Contents']:
            file_path = item['Key']
            
            # Skip if item is a folder (ends with /)
            if file_path.endswith('/'):
                continue
            
            # Skip if suffix doesn't match
            if suffix and not file_path.endswith(suffix):
                continue
            
            # Remove the prefix to get the file name
            file_name = file_path.replace(prefix, '')
            
            if file_name:
                files.append(file_name)
    
    return files


def combine_pdfs(s3_client, bucket: str, file_keys: List[str], output_key: str, 
                output_bucket: str, metadata: Optional[Dict[str, str]] = None) -> str:
    """
    Combine multiple PDFs from S3 into a single PDF and upload it back to S3
    
    Args:
        s3_client: Boto3 S3 client
        bucket: Source S3 bucket name
        file_keys: List of S3 keys for PDF files to combine
        output_key: S3 key for the output combined PDF
        output_bucket: Destination S3 bucket name
        metadata: Optional metadata to add to the output file
        
    Returns:
        S3 key of the combined PDF
    """
    # Create a PdfWriter for the output
    pdf_writer = PdfWriter()
    
    # Process each input PDF
    for file_key in file_keys:
        try:
            # Download the PDF from S3
            response = s3_client.get_object(Bucket=bucket, Key=file_key)
            pdf_bytes = response['Body'].read()
            
            # Read the PDF
            pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
            
            # Add each page to the writer
            for page_num in range(len(pdf_reader.pages)):
                pdf_writer.add_page(pdf_reader.pages[page_num])
                
        except Exception as e:
            print(f"Error processing PDF {file_key}: {str(e)}")
            continue
    
    # Write the combined PDF to a BytesIO object
    pdf_bytes_io = io.BytesIO()
    pdf_writer.write(pdf_bytes_io)
    pdf_bytes_io.seek(0)
    
    # Upload the combined PDF to S3
    upload_args = {
        'Bucket': output_bucket,
        'Key': output_key,
        'Body': pdf_bytes_io,
        'ContentType': 'application/pdf'
    }
    
    if metadata:
        upload_args['Metadata'] = metadata
    
    s3_client.upload_fileobj(**upload_args)
    
    return output_key


def create_presigned_url(s3_client, bucket: str, key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for an S3 object
    
    Args:
        s3_client: Boto3 S3 client
        bucket: S3 bucket name
        key: S3 object key
        expiration: URL expiration time in seconds
        
    Returns:
        Presigned URL as string
    """
    presigned_url = s3_client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket,
            'Key': key
        },
        ExpiresIn=expiration
    )
    
    return presigned_url
