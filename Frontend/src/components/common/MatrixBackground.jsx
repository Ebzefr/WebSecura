import React, { useEffect, useRef } from 'react';

const MatrixBackground = () => {
  const matrixBgRef = useRef(null);

  useEffect(() => {
    const securityTerms = [
      '[ ACCESS::GRANTED ]',
      '[ ACCESS::DENIED ]',
      '>> BREACH_DETECTED <<',
      '[ FIREWALL // ACTIVE ]',
      '[ ENCRYPTION_ENABLED ]',
      '<SSL::VERIFIED>',
      'HTTPS://SECURE_CONNECTION',
      'x-x SYSTEM_OVERRIDE x-x',
      '[ MALWARE~DETECTED ]',
      '!! PHISHING_ATTEMPT !!',
      ':: SECURE_CONNECTION ::',
      '[ AUTH_FAIL_CODE_401 ]',
      '[ UNAUTHORIZED_ACCESS ]',
      '>> SECURITY_ALERT_⚠️ <<',
      '[[ PENETRATION_TEST ]]',
      'EXPLOIT{ DETECTED }',
      '!! PATCH_REQUIRED !!',
      '[ THREAT_ANALYZED_OK ]',
      '{ DEFENSE::ACTIVE }',
      '[ MONITOR=ENABLED ]',
      '<< INTRUSION_DETECTED >>',
      '[ SECURITY:VIOLATION ]',
      '-- AUDIT_COMPLETE --',
      '<< BACKUP_VERIFIED >>',
      '[ SYSTEM_HARDENED_OK ]',
      '( RISK::ASSESSMENT )',
      '!! FIREWALL_BREACH !!',
      '[ ENCRYPTED::TRAFFIC ]',
      '== THREAT_NEUTRALIZED ==',
      '[ SCAN:SECURITY_RUN ]',
      '** VULNERABILITY::FOUND **',
      '[ ! ] BREACH_DETECTED [ ! ]',
    ];

    const createMatrixColumn = () => {
      if (!matrixBgRef.current) return;

      const column = document.createElement('div');
      column.className = 'matrix-text';

      // Extended distribution across the full width with bias towards left and center
      const sidesBias = 0.8;
      let leftPosition;

      if (Math.random() < sidesBias) {
        leftPosition = Math.random() * 100;
      } else {
        leftPosition = 75 + Math.random() * 25;
      }

      column.style.left = leftPosition + '%';
      column.style.animationDuration = Math.random() * 12 + 8 + 's';
      column.style.animationDelay = Math.random() * 2 + 's';
      column.style.top = '500px';

      // Color variations for glow effect
      const colorClasses = ['green', 'white', 'dim-green', 'dim-white'];
      const weights = [0.4, 0.3, 0.2, 0.1];
      const randomColor = Math.random();
      let selectedClass;

      if (randomColor < weights[0]) {
        selectedClass = colorClasses[0]; // green
      } else if (randomColor < weights[0] + weights[1]) {
        selectedClass = colorClasses[1]; // white
      } else if (randomColor < weights[0] + weights[1] + weights[2]) {
        selectedClass = colorClasses[2]; // dim-green
      } else {
        selectedClass = colorClasses[3]; // dim-white
      }

      column.classList.add(selectedClass);

      // Create a vertical string of security terms
      let text = '';
      const lineCount = Math.floor(Math.random() * 20 + 15);
      for (let i = 0; i < lineCount; i++) {
        const term =
          securityTerms[Math.floor(Math.random() * securityTerms.length)];
        text += term + '\n';

        // Add some random spacing
        if (Math.random() < 0.3) {
          text += '\n';
        }
      }
      column.textContent = text;

      matrixBgRef.current.appendChild(column);

      // Remove the column after animation
      setTimeout(() => {
        if (column.parentNode) {
          column.parentNode.removeChild(column);
        }
      }, parseFloat(column.style.animationDuration) * 1000 + parseFloat(column.style.animationDelay) * 1000);
    };

    // Create initial columns
    for (let i = 0; i < 30; i++) {
      setTimeout(createMatrixColumn, i * 150);
    }

    // Continue creating columns
    const interval = setInterval(createMatrixColumn, 350);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return <div className="matrix-bg" id="matrixBg" ref={matrixBgRef}></div>;
};

export default MatrixBackground;
