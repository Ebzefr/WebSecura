import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const SSOCallback = () => {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const completeSSO = async () => {
      try {
        await handleRedirectCallback();
        navigate('/');
      } catch (error) {
        console.error('SSO callback error:', error);
        navigate('/auth');
      }
    };

    completeSSO();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon 
          icon={faSpinner} 
          spin 
          className="text-6xl text-green-400 mb-4"
        />
        <p className="text-xl text-gray-300">Completing sign in...</p>
      </div>
    </div>
  );
};

export default SSOCallback;