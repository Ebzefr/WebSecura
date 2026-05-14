import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faExclamationTriangle, 
  faClock,
  faDollarSign,
  faCheckCircle,
  faCode,
  faChevronDown,
  faChevronUp,
  faCopy
} from '@fortawesome/free-solid-svg-icons';

const ActionableRecommendation = ({ check }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('general');
  const [copied, setCopied] = useState(false);

  if (check.passed || !check.actionable_fix) return null;

  const fix = check.actionable_fix;
  const platforms = Object.keys(fix.how_to_fix || {});

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'text-gray-400';
    if (risk.includes('HIGH')) return 'text-red-400';
    if (risk.includes('MEDIUM')) return 'text-orange-400';
    return 'text-yellow-400';
  };

  return (
    <div className="mt-3 border border-yellow-500/30 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 bg-yellow-900/20 hover:bg-yellow-900/30 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400" />
          <span className="text-sm font-medium text-yellow-200">
            How to Fix This Issue
          </span>
        </div>
        <div className="flex items-center gap-3">
          {fix.time && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faClock} className="text-xs" />
              {fix.time}
            </span>
          )}
          {fix.cost && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <FontAwesomeIcon icon={faDollarSign} className="text-xs" />
              {fix.cost}
            </span>
          )}
          <FontAwesomeIcon 
            icon={expanded ? faChevronUp : faChevronDown} 
            className="text-gray-400 text-sm"
          />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 bg-gray-900/50 space-y-4">
          {/* Risk Level */}
          {fix.risk && (
            <div className="flex items-start gap-2">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className={`mt-1 ${getRiskColor(fix.risk)}`}
              />
              <div>
                <p className="text-xs font-semibold text-gray-300 mb-1">Risk Level:</p>
                <p className={`text-sm ${getRiskColor(fix.risk)}`}>{fix.risk}</p>
              </div>
            </div>
          )}

          {/* Warning */}
          {fix.warning && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{fix.warning}</p>
            </div>
          )}

          {/* Platform Selector */}
          {platforms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-300 mb-2">Select Your Platform:</p>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlatform === platform
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fix Instructions */}
          {fix.how_to_fix && fix.how_to_fix[selectedPlatform] && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCode} />
                  Implementation:
                </p>
                <button
                  onClick={() => copyToClipboard(
                    typeof fix.how_to_fix[selectedPlatform] === 'string'
                      ? fix.how_to_fix[selectedPlatform]
                      : fix.how_to_fix[selectedPlatform].join('\n')
                  )}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faCopy} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              {typeof fix.how_to_fix[selectedPlatform] === 'string' ? (
                <pre className="p-3 bg-black/50 border border-gray-700 rounded-lg overflow-x-auto">
                  <code className="text-xs text-green-300">
                    {fix.how_to_fix[selectedPlatform]}
                  </code>
                </pre>
              ) : (
                <ol className="space-y-2">
                  {fix.how_to_fix[selectedPlatform].map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">{index + 1}.</span>
                      <span className="text-sm text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Verification */}
          {fix.verification && (
            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1" />
                <div>
                  <p className="text-xs font-semibold text-green-300 mb-1">Verify It Works:</p>
                  <p className="text-sm text-gray-300">{fix.verification}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionableRecommendation;