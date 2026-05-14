import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faFileCode,
  faFilePdf,
  faFileCsv,
  faShieldAlt,
  faGauge,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faLightbulb,
  faCalendarAlt,
  faLink,
  faChevronDown,
  faChevronUp,
  faSpinner,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import ActionableRecommendation from './ActionableRecommendation';
import { exportToPDF, exportToCSV } from '../utils/exportReports';

const ScanResultsModal = ({ results, onClose }) => {
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const [performanceExpanded, setPerformanceExpanded] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);

  if (!results) return null;

  const { url, scan_time, security, performance, overall_score } = results;
  const securityScore = security?.score || 0;
  const performanceScore = performance?.overall_score || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#fb923c';
    return '#ef4444';
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      await exportToPDF(results);
      setExportSuccess('PDF exported successfully');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportError('Failed to export PDF. Please try again.');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      await exportToCSV(results);
      setExportSuccess('CSV exported successfully');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('CSV export error:', error);
      setExportError('Failed to export CSV. Please try again.');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExportingCSV(false);
    }
  };

  const downloadJSON = async () => {
    setExportingJSON(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `websecura-scan-${new Date().getTime()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setExportSuccess('JSON exported successfully');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('JSON export error:', error);
      setExportError('Failed to export JSON. Please try again.');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExportingJSON(false);
    }
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

  const CircularProgress = ({ score, label, size = 'large' }) => {
    const radius = size === 'large' ? 60 : 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size === 'large' ? 160 : 120, height: size === 'large' ? 160 : 120 }}>
          <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="12" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl md:text-4xl font-bold text-white">{score}</span>
          </div>
        </div>
        <p className="text-gray-300 mt-3 font-medium text-center">{label}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-green-500/30 shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)' }}>
        
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-800 rounded-t-2xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} className="text-green-400 text-base sm:text-xl flex-shrink-0" />
                <span className="truncate">Scan Results</span>
              </h2>
              <div className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLink} className="text-xs flex-shrink-0" />
                  <span className="truncate">{url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-xs flex-shrink-0" />
                  <span className="whitespace-nowrap">{formatDate(scan_time)}</span>
                </div>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button 
                onClick={handleExportPDF}
                disabled={exportingPDF || exportingCSV || exportingJSON}
                className="p-2 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Export PDF"
              >
                {exportingPDF ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-red-400 text-base sm:text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faFilePdf} className="text-red-400 hover:text-red-300 text-base sm:text-lg" />
                )}
              </button>
              <button 
                onClick={handleExportCSV}
                disabled={exportingPDF || exportingCSV || exportingJSON}
                className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Export CSV"
              >
                {exportingCSV ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 text-base sm:text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faFileCsv} className="text-blue-400 hover:text-blue-300 text-base sm:text-lg" />
                )}
              </button>
              <button 
                onClick={downloadJSON}
                disabled={exportingPDF || exportingCSV || exportingJSON}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Download JSON"
              >
                {exportingJSON ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-green-400 text-base sm:text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faFileCode} className="text-green-400 hover:text-green-300 text-base sm:text-lg" />
                )}
              </button>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-400 hover:text-red-400 text-lg sm:text-xl" />
              </button>
            </div>
          </div>

          {/* Export Success Message */}
          {exportSuccess && (
            <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 flex-shrink-0" />
              <span className="text-green-400 font-semibold">{exportSuccess}</span>
            </div>
          )}

          {/* Export Error Message */}
          {exportError && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-xs sm:text-sm">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">{exportError}</p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Scores */}
          <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-800">
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
              <div className="flex justify-center">
                <CircularProgress score={overall_score} label="Overall Score" size="large" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                <div className="flex justify-center">
                  <CircularProgress score={securityScore} label="Security Checks" size="small" />
                </div>
                <div className="flex justify-center">
                  <CircularProgress score={performanceScore} label="Performance Analysis" size="small" />
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            
            {/* Security Checks */}
            {security?.results && security.results.length > 0 && (
              <div>
                <button 
                  onClick={() => setSecurityExpanded(!securityExpanded)} 
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-700/50"
                >
                  <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-green-400 text-sm sm:text-base" />
                    <span className="text-sm sm:text-xl">Security Checks ({security.summary.passed_checks}/{security.summary.total_checks})</span>
                  </h3>
                  <FontAwesomeIcon icon={securityExpanded ? faChevronUp : faChevronDown} className="text-gray-400 text-sm sm:text-base" />
                </button>
                
                {securityExpanded && (
                  <div className="space-y-3 mt-4">
                    {security.results.map((check, index) => (
                      <div key={index} className={`p-3 sm:p-4 rounded-lg border ${check.passed ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <FontAwesomeIcon icon={check.passed ? faCheckCircle : faTimesCircle} className={`mt-1 flex-shrink-0 ${check.passed ? 'text-green-400' : 'text-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">{check.check}</h4>
                            <p className="text-xs sm:text-sm text-gray-300 mb-2">{check.description}</p>
                            
                            {/* ActionableRecommendation for each failed check */}
                            {!check.passed && (
                              <ActionableRecommendation check={check} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Performance Analysis */}
            {performance?.metrics && (
              <div>
                <button 
                  onClick={() => setPerformanceExpanded(!performanceExpanded)} 
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-700/50"
                >
                  <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    <FontAwesomeIcon icon={faGauge} className="text-blue-400 text-sm sm:text-base" />
                    <span className="text-sm sm:text-xl">Performance Analysis</span>
                  </h3>
                  <FontAwesomeIcon icon={performanceExpanded ? faChevronUp : faChevronDown} className="text-gray-400 text-sm sm:text-base" />
                </button>
                
                {performanceExpanded && (
                  <>
                    <div className="space-y-3 mt-4">
                      {Object.entries(performance.metrics).map(([key, metric], index) => {
                        if (!metric || typeof metric !== 'object') return null;
                        const isGood = metric.score >= 80;
                        const isFair = metric.score >= 60 && metric.score < 80;
                        
                        return (
                          <div key={index} className={`p-3 sm:p-4 rounded-lg border ${isGood ? 'bg-green-900/20 border-green-500/30' : isFair ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white mb-1 capitalize text-sm sm:text-base">{key.replace(/_/g, ' ')}</h4>
                                <p className="text-xs sm:text-sm text-gray-300">{metric.description}</p>
                              </div>
                              <span className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${isGood ? 'bg-green-500/20 text-green-300' : isFair ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                                {metric.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Performance Recommendations */}
                    {performance?.recommendations && performance.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
                          <span className="text-sm sm:text-base">Optimization Recommendations</span>
                        </h4>
                        <div className="space-y-2">
                          {performance.recommendations.map((rec, index) => (
                            <div key={index} className="p-2 sm:p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                              <div className="flex items-start gap-2">
                                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 mt-1 flex-shrink-0 text-xs sm:text-sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-yellow-200">{rec.category}</p>
                                  <p className="text-xs sm:text-sm text-gray-300 mt-1">{rec.recommendation}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${rec.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                  {rec.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultsModal;