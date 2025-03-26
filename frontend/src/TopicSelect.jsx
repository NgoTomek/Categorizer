import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TopicSelect = ({ subject, onTopicsSelect, authTokens }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_ENDPOINT}/topics?subject=${subject.id}`,
          {
            headers: {
              Authorization: `Bearer ${authTokens.idToken}`,
            },
          }
        );
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to load topics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [subject, authTokens]);

  const handleTopicChange = (topic, checked) => {
    if (checked) {
      setSelectedTopics((prev) => [
        ...prev,
        { 
          id: topic.id,
          name: topic.name,
          questionCount: 1
        },
      ]);
    } else {
      setSelectedTopics((prev) =>
        prev.filter((t) => t.id !== topic.id)
      );
    }
  };

  const handleQuestionCountChange = (topicId, count) => {
    setSelectedTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId
          ? { ...topic, questionCount: parseInt(count, 10) || 1 }
          : topic
      )
    );
  };

  const handleSubmit = () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic.');
      return;
    }

    const formattedTopics = selectedTopics.map((topic) => ({
      topic_id: topic.id,
      question_count: topic.questionCount,
    }));

    onTopicsSelect(formattedTopics);
    navigate('/settings');
  };

  const handleBack = () => {
    navigate('/subjects');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Select Topics from {subject.name}</h2>
      <p className="text-gray-600 mb-6">Choose the topics you want to include in your question paper</p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {topics.length === 0 ? (
        <p className="text-gray-600">No topics available for this subject.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {topics.map((topic) => {
              const isSelected = selectedTopics.some((t) => t.id === topic.id);
              const selectedTopic = selectedTopics.find((t) => t.id === topic.id);
              
              return (
                <li key={topic.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id={`topic-${topic.id}`}
                        name={`topic-${topic.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleTopicChange(topic, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`topic-${topic.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                        {topic.name}
                      </label>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center">
                        <label htmlFor={`count-${topic.id}`} className="mr-2 block text-sm font-medium text-gray-700">
                          Questions:
                        </label>
                        <select
                          id={`count-${topic.id}`}
                          name={`count-${topic.id}`}
                          value={selectedTopic.questionCount}
                          onChange={(e) => handleQuestionCountChange(topic.id, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedTopics.length === 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            selectedTopics.length === 0
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default TopicSelect;
