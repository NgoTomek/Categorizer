import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PaperPreview = ({ paper }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Reset state when paper changes
    setPageNumber(1);
    setNumPages(null);
    setLoading(true);
    setError('');
  }, [paper]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load the PDF document. Please try downloading it directly.');
    setLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const handleDownload = () => {
    window.open(paper.downloadUrl, '_blank');
  };

  const handleCreateNew = () => {
    navigate('/subjects');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 w-full max-w-2xl">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{paper.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Paper ID: {paper.id}
            </p>
          </div>
          <div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 w-full max-w-2xl">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 w-full max-w-4xl">
          <div className="px-4 py-5 sm:px-6 flex flex-col items-center">
            {loading && (
              <div className="flex justify-center items-center h-96">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            <Document
              file={paper.downloadUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center items-center h-96">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                width={window.innerWidth > 768 ? 600 : window.innerWidth - 40}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>

            {numPages && (
              <div className="flex items-center mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1}
                  className={`inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                    pageNumber <= 1
                      ? 'text-gray-400 bg-gray-100'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2`}
                >
                  Previous
                </button>
                <p className="text-sm text-gray-700">
                  Page {pageNumber} of {numPages}
                </p>
                <button
                  onClick={handleNextPage}
                  disabled={pageNumber >= numPages}
                  className={`inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                    pageNumber >= numPages
                      ? 'text-gray-400 bg-gray-100'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-2`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Create New Paper
        </button>
      </div>
    </div>
  );
};

export default PaperPreview;
