import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import Login from './Login';
import SubjectSelect from './SubjectSelect';
import TopicSelect from './TopicSelect';
import SettingsForm from './SettingsForm';
import PaperPreview from './PaperPreview';

// AWS Amplify configuration
const amplifyConfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: process.env.REACT_APP_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      },
    ],
  },
};

Amplify.configure(amplifyConfig);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authTokens, setAuthTokens] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [paperSettings, setPaperSettings] = useState({
    title: '',
    durationMinutes: 60,
  });
  const [generatedPaper, setGeneratedPaper] = useState(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const tokens = localStorage.getItem('authTokens');
        if (tokens) {
          setAuthTokens(JSON.parse(tokens));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('authTokens');
      }
    };

    checkAuthState();
  }, []);

  const handleLogin = (tokens) => {
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    setAuthTokens(tokens);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authTokens');
    setAuthTokens(null);
    setIsAuthenticated(false);
    setSelectedSubject(null);
    setSelectedTopics([]);
    setPaperSettings({
      title: '',
      durationMinutes: 60,
    });
    setGeneratedPaper(null);
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopics([]);
  };

  const handleTopicSelect = (topics) => {
    setSelectedTopics(topics);
  };

  const handleSettingsChange = (settings) => {
    setPaperSettings(settings);
  };

  const handlePaperGenerated = (paper) => {
    setGeneratedPaper(paper);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Question Paper Generator</h1>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/subjects" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/subjects"
              element={
                isAuthenticated ? (
                  <SubjectSelect 
                    onSubjectSelect={handleSubjectSelect} 
                    authTokens={authTokens}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/topics"
              element={
                isAuthenticated && selectedSubject ? (
                  <TopicSelect
                    subject={selectedSubject}
                    onTopicsSelect={handleTopicSelect}
                    authTokens={authTokens}
                  />
                ) : (
                  <Navigate to="/subjects" />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated && selectedSubject && selectedTopics.length > 0 ? (
                  <SettingsForm
                    subject={selectedSubject}
                    topics={selectedTopics}
                    settings={paperSettings}
                    onSettingsChange={handleSettingsChange}
                    onPaperGenerated={handlePaperGenerated}
                    authTokens={authTokens}
                  />
                ) : (
                  <Navigate to="/topics" />
                )
              }
            />
            <Route
              path="/preview"
              element={
                isAuthenticated && generatedPaper ? (
                  <PaperPreview paper={generatedPaper} />
                ) : (
                  <Navigate to="/settings" />
                )
              }
            />
          </Routes>
        </main>

        <footer className="bg-white shadow-inner mt-8">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500">
              &copy; {new Date().getFullYear()} Question Paper Generator. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
