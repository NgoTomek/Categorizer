import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SettingsForm = ({ subject, topics, settings, onSettingsChange, onPaperGenerated, authTokens }) => {
  const [title, setTitle] = useState(settings.title || `${subject.name} Exam`);
  const [durationMinutes, setDurationMinutes] = useState(settings.durationMinutes || 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Update parent component with current settings
    const currentSettings = {
      title,
      durationMinutes: parseInt(durationMinutes, 10),
    };
    onSettingsChange(currentSettings);

    try {
      // Prepare request payload
      const payload = {
        title: title,
        subject: subject.id,
        topics: topics,
        duration_minutes: parseInt(durationMinutes, 10),
      };

      // Make API request to generate paper
      const response = await axios.post(
        `${process.env.REACT_APP_API_ENDPOINT}/generate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authTokens.idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Notify parent component of generated paper
      onPaperGenerated({
        id: response.data.paper_id,
        title: response.data.title,
        downloadUrl: response.data.download_url,
        expiresIn: response.data.expires_in,
      });

      // Navigate to preview page
      navigate('/preview');
    } catch (error) {
      console.error('Error generating paper:', error);
      
      if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to generate paper. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Update parent component with current settings before navigating
    onSettingsChange({
      title,
      durationMinutes: parseInt(durationMinutes, 10),
    });
    navigate('/topics');
  };

  // Count total questions
  const totalQuestions = topics.reduce(
    (total, topic) => total + topic.question_count,
    0
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Paper Settings</h2>
      <p className="text-gray-600 mb-6">Configure your question paper settings</p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Paper Summary</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subject</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{subject.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Selected Topics</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {topics.map((topic) => (
                    <li key={topic.topic_id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <span className="ml-2 flex-1 w-0 truncate">{topic.topic_id.replace("_", " ").toUpperCase()}</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium">{topic.question_count} questions</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{totalQuestions}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Paper Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  min="10"
                  max="240"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Generating...' : 'Generate Paper'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;
