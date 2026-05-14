import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faShieldAlt,
  faExclamationTriangle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useUser, useAuth } from '@clerk/clerk-react';
import ScanResultsModal from '../components/ScanModal';

const Home = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [scanProgress, setScanProgress] = useState('');
  
  const { user } = useUser();
  const { getToken } = useAuth();

  const handleScan = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    // Validation
    if (!url.trim()) {
      setError('Please enter a website URL');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url.trim())) {
      setError('Please enter a valid URL (e.g., example.com or https://example.com)');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsScanning(true);
    setScanResults(null);
    setScanProgress('Initializing scan...');

    try {
      // Simulate progress updates
      setTimeout(() => setScanProgress('Running security checks...'), 1000);
      setTimeout(() => setScanProgress('Analyzing performance...'), 3000);
      setTimeout(() => setScanProgress('Generating report...'), 6000);

      // Get Clerk token if user is signed in
      const token = user ? await getToken() : null;
      
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ 
          url: url.trim(),
          user_id: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Scan failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();

      if (results.status === 'error') {
        throw new Error(results.error || 'Scan failed');
      }

      if (results.status === 'success') {
        setScanResults(results);
        setShowModal(true);
        setUrl(''); // Clear input after successful scan
      } else {
        throw new Error('Unexpected response format');
      }

    } catch (error) {
      console.error('Scan error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to scan website. ';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'The scan took too long. The website might be slow or unavailable.';
      } else if (error.message.includes('404')) {
        errorMessage += 'Website not found. Please check the URL and try again.';
      } else if (error.message.includes('500')) {
        errorMessage += 'Server error. Please try again in a moment.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  return (
    <>
      {/* Hero Section - Full Screen Centered */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Making your browsing experience,{' '}
            <span className="logo-shield">safer..</span>
          </h1>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="search-container rounded-2xl p-6 md:p-8">
              <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter a website link..."
                  className="search-input flex-1 px-6 py-4 rounded-xl text-base md:text-lg placeholder-gray-500 focus:outline-none"
                  disabled={isScanning}
                  required
                />
                <button
                  type="submit"
                  className="search-btn px-8 py-4 rounded-xl font-semibold text-white whitespace-nowrap text-base md:text-lg"
                  disabled={isScanning}
                  style={{
                    opacity: isScanning ? 0.7 : 1,
                    cursor: isScanning ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isScanning ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Scanning...
                    </>
                  ) : (
                    'Scan Now'
                  )}
                </button>
              </form>

              {/* Progress Text */}
              {isScanning && scanProgress && (
                <div className="mt-4 text-center">
                  <p className="text-green-400 text-sm animate-pulse">{scanProgress}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-xl mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-400 font-semibold mb-1">Scan Failed</p>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
              
              {/* Sign in prompt for anonymous users */}
              {!user && (
                <p className="mt-4 text-gray-400 text-sm">
                  <a href="/auth" className="text-green-400 hover:text-green-300 font-semibold">
                    Sign in
                  </a>
                  {' '}to save scan history and access advanced features
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats or Trust Indicators */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">10k+</div>
              <div className="text-gray-400 text-sm md:text-base">Scans Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-gray-400 text-sm md:text-base">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">&lt;30s</div>
              <div className="text-gray-400 text-sm md:text-base">Average Scan Time</div>
            </div>
          </div>

        </div>
      </section>

      {/* Scan Results Modal */}
      {showModal && (
        <ScanResultsModal
          results={scanResults}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default Home;