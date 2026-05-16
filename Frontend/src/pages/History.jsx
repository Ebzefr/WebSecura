import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory, 
  faPlus, 
  faShieldAlt, 
  faCalendarAlt,
  faLink,
  faSpinner,
  faTrash,
  faExclamationTriangle,
  faDownload,
  faTimes,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useUser, useAuth } from '@clerk/clerk-react';
import ScanResultsModal from '../components/ScanModal';
import { exportHistoryToCSV } from '../utils/exportReports';

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const { user } = useUser();
  const { getToken } = useAuth();


  const fetchScanHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      const response = await fetch(`https://websecura.onrender.com/api/scan-history/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to load scan history');
      }

      setScans(data.scans || []);
    } catch (error) {
      console.error('Error fetching scan history:', error);
      setError(error.message || 'Failed to load scan history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (user) {
      fetchScanHistory();
    }
  }, [user, fetchScanHistory]);
  const confirmDelete = (scan, e) => {
    e.stopPropagation();
    setScanToDelete(scan);
    setShowDeleteModal(true);
  };

  const deleteScan = async () => {
    if (!scanToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`https://websecura.onrender.com/api/scan-history/${scanToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      // Remove from state immediately
      setScans(scans.filter(scan => scan.id !== scanToDelete.id));
      setShowDeleteModal(false);
      setScanToDelete(null);

      // Show success message
      setSuccessMessage('Scan deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting scan:', error);
      setError('Failed to delete scan. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const viewScan = (scan) => {
    try {
      const scanData = JSON.parse(scan.scan_data);
      setSelectedScan(scanData);
      setShowModal(true);
    } catch (error) {
      console.error('Error parsing scan data:', error);
      setError('Failed to load scan details. Data may be corrupted.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportAll = () => {
    try {
      if (scans.length === 0) {
        setError('No scans to export');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      exportHistoryToCSV(scans);
      
      setSuccessMessage(`Exported ${scans.length} scan(s) to CSV`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export history. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <main className="relative z-10 flex items-start justify-center min-h-screen px-4 sm:px-6 py-20">
        <div className="max-w-6xl w-full mx-auto">
          <div className="contact-card">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="contact-icon mb-4">
                <FontAwesomeIcon icon={faHistory} className="text-5xl sm:text-6xl logo-shield" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Scan <span className="logo-shield">History</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg">
                Review your previous security scans and their results
              </p>
              <div className="contact-divider"></div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-xl flex-shrink-0" />
                <p className="text-green-400 font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-xl mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold mb-1">Error</p>
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

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all font-semibold"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  New Scan
                </Link>
                
                {scans.length > 0 && (
                  <button
                    onClick={handleExportAll}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-all font-semibold"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Export CSV
                  </button>
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {scans.length} scan{scans.length !== 1 ? 's' : ''} total
              </div>
            </div>

            {/* Scan List */}
            {loading ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="text-4xl text-green-400 animate-spin mb-4" />
                <p className="text-gray-300">Loading scan history...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faShieldAlt} className="text-5xl sm:text-6xl logo-shield mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-4">No Scans Yet</h3>
                <p className="text-gray-300 mb-6">
                  Your scan history will appear here after you run your first scan.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold"
                >
                  <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                  Run Your First Scan
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => viewScan(scan)}
                    className="p-4 sm:p-6 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer"
                    style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* URL and Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <FontAwesomeIcon icon={faLink} className="text-gray-400 mt-1 flex-shrink-0 text-sm" />
                          <a
                            href={scan.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-white hover:text-green-400 transition-colors font-medium break-all lg:truncate text-sm sm:text-base hover:underline"
                          >
                            {scan.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm ml-6">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                          <span>{formatDate(scan.scan_time)}</span>
                        </div>
                      </div>

                      {/* Scores and Delete */}
                      <div className="flex items-center gap-4 lg:gap-6 py-3 lg:py-0 border-y lg:border-y-0 border-gray-700/50">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${getScoreColor(scan.overall_score)}`}>
                              {scan.overall_score}
                            </div>
                            <div className="text-xs text-gray-400">Overall</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${getScoreColor(scan.security_score)}`}>
                              {scan.security_score}
                            </div>
                            <div className="text-xs text-gray-400">Security</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${getScoreColor(scan.performance_score || 0)}`}>
                              {scan.performance_score || 0}
                            </div>
                            <div className="text-xs text-gray-400">Performance</div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => confirmDelete(scan, e)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete scan"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && scanToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl p-6"
            style={{ 
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Red Glow Beam at Top */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
              style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
            ></div>

            {/* Warning Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Scan?</h2>
              <p className="text-gray-300 text-sm">This action cannot be undone</p>
            </div>

            {/* Scan Details */}
            <div className="mb-6 p-3 rounded-lg border border-gray-700/50" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="flex items-start gap-2 mb-2">
                <FontAwesomeIcon icon={faLink} className="text-gray-500 mt-1 text-xs flex-shrink-0" />
                <p className="text-white text-sm break-all">{scanToDelete.url}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 ml-5">
                <span>Score: {scanToDelete.overall_score}</span>
                <span>{formatDate(scanToDelete.scan_time)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setScanToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteScan}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all font-semibold text-white shadow-lg shadow-red-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Results Modal */}
      {showModal && selectedScan && (
        <ScanResultsModal
          results={selectedScan}
          onClose={() => {
            setShowModal(false);
            setSelectedScan(null);
          }}
        />
      )}
    </>
  );
};

export default History;