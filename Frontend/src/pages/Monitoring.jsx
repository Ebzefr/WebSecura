import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faPlus,
  faTrash,
  faToggleOn,
  faToggleOff,
  faChartLine,
  faExclamationTriangle,
  faCheckCircle,
  faSpinner,
  faLink,
  faCalendarAlt,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useUser, useAuth } from '@clerk/clerk-react';

const Monitoring = () => {
  const [schedules, setSchedules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [emailPrefs, setEmailPrefs] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(null); // Track which schedule is being toggled
  
  const { user } = useUser();
  const { getToken } = useAuth();

  // Form state
  const [newScan, setNewScan] = useState({
    url: '',
    frequency: 'daily',
    alert_threshold: 10
  });
  const [formError, setFormError] = useState(null);

  

  useEffect(() => {
    if (user) {
      const fetchAllData = async () => {
        await Promise.all([
          fetchSchedules(),
          fetchAlerts(),
          fetchEmailPreferences()
        ]);
      };
      fetchAllData();
    }
  }, [user]); 
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/monitoring/schedules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load schedules: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setSchedules(data.schedules);
      } else {
        throw new Error(data.error || 'Failed to load schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError(error.message || 'Failed to load monitoring schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/monitoring/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load alerts');
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Don't show error for alerts, just fail silently
    }
  };

  const fetchEmailPreferences = async () => {
    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/monitoring/email/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load email preferences');
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        setEmailPrefs(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      // Don't show error for email prefs, just fail silently
    }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    
    // Validation
    setFormError(null);
    
    if (!newScan.url.trim()) {
      setFormError('Please enter a website URL');
      return;
    }

    // Basic URL validation
const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(newScan.url.trim())) {
      setFormError('Please enter a valid URL (e.g., example.com or https://example.com)');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/monitoring/schedules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newScan)
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setShowAddModal(false);
        setNewScan({ url: '', frequency: 'daily', alert_threshold: 10 });
        setFormError(null);
        await fetchSchedules();
        
        setSuccessMessage('Schedule created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      setFormError(error.message || 'Failed to create schedule. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = (schedule, e) => {
    e.stopPropagation();
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const deleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:5000/api/monitoring/schedules/${scheduleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      setSchedules(schedules.filter(s => s.id !== scheduleToDelete.id));
      setShowDeleteModal(false);
      setScheduleToDelete(null);

      setSuccessMessage('Schedule deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('Failed to delete schedule. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSchedule = async (scanId, currentStatus) => {
    setIsToggling(scanId);
    setError(null);

    try {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:5000/api/monitoring/schedules/${scanId}/toggle`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle schedule');
      }

      await fetchSchedules();

      setSuccessMessage(`Schedule ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error toggling schedule:', error);
      setError('Failed to toggle schedule. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsToggling(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      hourly: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      daily: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      weekly: 'bg-green-500/20 text-green-300 border-green-500/30',
      monthly: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return colors[frequency] || colors.daily;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please log in to access monitoring features</p>
      </div>
    );
  }

  return (
    <>
      <main className="relative z-10 flex items-start justify-center min-h-screen px-4 sm:px-6 py-20">
        <div className="max-w-6xl w-full mx-auto">
          <div className="contact-card">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="contact-icon mb-4">
                <FontAwesomeIcon icon={faBell} className="text-5xl sm:text-6xl logo-shield" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Continuous <span className="logo-shield">Monitoring</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg">
                Schedule automated security scans and get alerts when issues are detected
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

            {/* Email Not Configured Warning */}
            {emailPrefs && !emailPrefs.smtp_configured && (
              <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 mt-1" />
                  <div>
                    <p className="text-yellow-200 font-semibold">Email Alerts Not Configured</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Set up email configuration to receive alerts when security scores drop.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all font-semibold"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Monitored Site
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                {schedules.length} site{schedules.length !== 1 ? 's' : ''} monitored
              </div>
            </div>

            {/* Scheduled Scans */}
            {loading ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="text-4xl text-green-400 animate-spin mb-4" />
                <p className="text-gray-300">Loading monitored sites...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faChartLine} className="text-5xl sm:text-6xl logo-shield mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold mb-4">No Monitored Sites</h3>
                <p className="text-gray-300 mb-6">
                  Add a site to start continuous monitoring and receive alerts.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Your First Site
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 sm:p-6 rounded-lg border border-green-500/30 hover:border-green-500/50 transition-all"
                    style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      
                      {/* URL and Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <FontAwesomeIcon icon={faLink} className="text-gray-400 mt-1 flex-shrink-0 text-sm" />
                          <a
                            href={schedule.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-green-400 transition-colors font-medium break-all lg:truncate text-sm sm:text-base hover:underline"
                          >
                            {schedule.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-xs sm:text-sm ml-6">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                            <span>Next: {formatDate(schedule.next_run)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getFrequencyBadge(schedule.frequency)}`}>
                            {schedule.frequency}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 lg:gap-4 py-3 lg:py-0 border-y lg:border-y-0 border-gray-700/50">
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1 text-green-400">
                            {schedule.last_score || '--'}
                          </div>
                          <div className="text-xs text-gray-400">Last Score</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                            disabled={isToggling === schedule.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              schedule.is_active 
                                ? 'text-green-400 hover:bg-green-900/20' 
                                : 'text-gray-500 hover:bg-gray-800'
                            }`}
                            title={schedule.is_active ? 'Disable' : 'Enable'}
                          >
                            {isToggling === schedule.id ? (
                              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
                            ) : (
                              <FontAwesomeIcon 
                                icon={schedule.is_active ? faToggleOn : faToggleOff} 
                                className="text-2xl"
                              />
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => confirmDelete(schedule, e)}
                            className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Alerts Section */}
            {schedules.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-700/50">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
                    Recent Alerts
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">
                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''} total
                  </p>
                </div>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-5xl sm:text-6xl text-green-600 mb-4" />
                    <h3 className="text-xl sm:text-2xl font-bold mb-4">No Alerts Yet</h3>
                    <p className="text-gray-300">
                      You'll be notified when security scores drop
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {alerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 sm:p-6 rounded-lg border border-red-500/30"
                        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-1 flex-shrink-0 text-sm" />
                              <div>
                                <p className="text-white font-medium text-sm sm:text-base">{alert.message}</p>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1 break-all">{alert.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm ml-6">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                              <span>{formatDate(alert.sent_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 py-3 lg:py-0 border-y lg:border-y-0 border-gray-700/50">
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1 text-red-400">
                                {alert.old_score}
                              </div>
                              <div className="text-xs text-gray-400">Old</div>
                            </div>
                            <div className="text-gray-500">→</div>
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1 text-orange-400">
                                {alert.new_score}
                              </div>
                              <div className="text-xs text-gray-400">New</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-green-500/30 shadow-2xl" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)' }}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Add Monitored Site</h2>
              
              {/* Form Error */}
              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-sm mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{formError}</p>
                </div>
              )}

              <form onSubmit={createSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={newScan.url}
                    onChange={(e) => setNewScan({ ...newScan, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Scan Frequency</label>
                  <select
                    value={newScan.frequency}
                    onChange={(e) => setNewScan({ ...newScan, frequency: e.target.value })}
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Alert Threshold (points)</label>
                  <input
                    type="number"
                    value={newScan.alert_threshold}
                    onChange={(e) => setNewScan({ ...newScan, alert_threshold: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert me if score drops by this many points</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormError(null);
                    }}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Creating...</span>
                      </>
                    ) : (
                      'Add Schedule'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && scheduleToDelete && (
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
              <h2 className="text-2xl font-bold text-white mb-2">Delete Schedule?</h2>
              <p className="text-gray-300 text-sm">This will stop automated monitoring for this site</p>
            </div>

            {/* Schedule Details */}
            <div className="mb-6 p-3 rounded-lg border border-gray-700/50" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="flex items-start gap-2 mb-2">
                <FontAwesomeIcon icon={faLink} className="text-gray-500 mt-1 text-xs flex-shrink-0" />
                <p className="text-white text-sm break-all">{scheduleToDelete.url}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 ml-5">
                <span className={`px-2 py-0.5 rounded border ${getFrequencyBadge(scheduleToDelete.frequency)}`}>
                  {scheduleToDelete.frequency}
                </span>
                <span>Last score: {scheduleToDelete.last_score || 'N/A'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setScheduleToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteSchedule}
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
    </>
  );
};

export default Monitoring;