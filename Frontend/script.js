function createMatrixRain() {
    const matrixBg = document.getElementById('matrixBg');
    if (!matrixBg) return; // Exit if element doesn't exist
    
    const securityTerms = [
        '[ ACCESS::GRANTED ]', '[ ACCESS::DENIED ]', '>> BREACH_DETECTED <<', '[ FIREWALL // ACTIVE ]',
        '[ ENCRYPTION_ENABLED ]', '<SSL::VERIFIED>', 'HTTPS://SECURE_CONNECTION', 'x-x SYSTEM_OVERRIDE x-x',
        '[ MALWARE~DETECTED ]', '!! PHISHING_ATTEMPT !!', ':: SECURE_CONNECTION ::',
        '[ AUTH_FAIL_CODE_401 ]', '[ UNAUTHORIZED_ACCESS ]', '>> SECURITY_ALERT_⚠️ <<',
        '[[ PENETRATION_TEST ]]', 'EXPLOIT{ DETECTED }', '!! PATCH_REQUIRED !!','[ THREAT_ANALYZED_OK ]', 
        '{ DEFENSE::ACTIVE }', '[ MONITOR=ENABLED ]','<< INTRUSION_DETECTED >>', '[ SECURITY:VIOLATION ]', 
        '-- AUDIT_COMPLETE --','<< BACKUP_VERIFIED >>', '[ SYSTEM_HARDENED_OK ]', '( RISK::ASSESSMENT )',
        '!! FIREWALL_BREACH !!', '[ ENCRYPTED::TRAFFIC ]', '== THREAT_NEUTRALIZED ==','[ SCAN:SECURITY_RUN ]', 
        '** VULNERABILITY::FOUND **', '[ ! ] BREACH_DETECTED [ ! ]'
    ];
    
    function createMatrixColumn() {
        const column = document.createElement('div');
        column.className = 'matrix-text';
        
        // Extended distribution across the full width with bias towards left and center
        const sidesBias = 0.8; // Higher value = more coverage on sides
        let leftPosition;
        
        if (Math.random() < sidesBias) {
            // Extended distribution covering left side and center (0% to 85% of screen width)
            leftPosition = Math.random() * 100;
        } else {
            // Some columns on the right side for balance
            leftPosition = 75 + Math.random() * 25;
        }
        
        column.style.left = leftPosition + '%';
        column.style.animationDuration = (Math.random() * 12 + 8) + 's';
        column.style.animationDelay = Math.random() * 2 + 's';
        
        // Start the animation from under the search bar (around 500px from top)
        column.style.top = '500px';
        
        // Color variations for glow effect
        const colorClasses = ['green', 'white', 'dim-green', 'dim-white'];
        const weights = [0.4, 0.3, 0.2, 0.1]; // Higher chance for green and white
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
            const term = securityTerms[Math.floor(Math.random() * securityTerms.length)];
            text += term + '\n';
            
            // Add some random spacing
            if (Math.random() < 0.3) {
                text += '\n';
            }
        }
        column.textContent = text;
        
        matrixBg.appendChild(column);
        
        // Remove the column after animation
        setTimeout(() => {
            if (column.parentNode) {
                column.parentNode.removeChild(column);
            }
        }, parseFloat(column.style.animationDuration) * 1000 + parseFloat(column.style.animationDelay) * 1000);
    }
    
    // Create more initial columns for better coverage
    for (let i = 0; i < 30; i++) {
        setTimeout(createMatrixColumn, i * 150);
    }
    
    // Continue creating columns at shorter intervals for denser effect
    setInterval(createMatrixColumn, 350);
}

// Initialize matrix effect
createMatrixRain();

//Search functinality
function initSearchFunctionality() {
    const searchBtn = document.getElementById('searchBtn');
    const websiteUrl = document.getElementById('websiteUrl');
    
    if (searchBtn && websiteUrl) {
        // Search button click
        searchBtn.addEventListener('click', function() {
            const url = websiteUrl.value.trim();
            if (!url) {
                alert('Please enter a website URL');
                return;
            }
            
            // Validate URL format
            try {
                new URL(url.startsWith('http') ? url : 'https://' + url);
            } catch (e) {
                alert('Please enter a valid URL');
                return;
            }
            
            // Call Flask backend
            performSecurityScan(url);
        });
        
        // Enter key support
        websiteUrl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        
        // Add visual feedback for the input
        websiteUrl.addEventListener('focus', function() {
            this.parentElement.parentElement.style.transform = 'scale(1.02)';
        });
        
        websiteUrl.addEventListener('blur', function() {
            this.parentElement.parentElement.style.transform = 'scale(1)';
        });
    }
}

async function performSecurityScan(url) {
    const searchBtn = document.getElementById('searchBtn');
    const websiteUrl = document.getElementById('websiteUrl');
    const originalText = searchBtn.innerHTML;
    
    try {
        // Show loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Scanning...';
        searchBtn.disabled = true;
        
        console.log('Starting scan for:', url); // Debug log
        
        // Get user info from localStorage
        const userStr = localStorage.getItem('webSecuraUser');
        let userId = null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.id;
                console.log('Found user ID:', userId); // Debug log
            } catch (error) {
                console.log('No valid user found in localStorage');
            }
        } else {
            console.log('No user found in localStorage');
        }
        
        // Prepare request body
        const requestBody = { url: url };
        if (userId) {
            requestBody.user_id = userId; // Add user_id to request
            console.log('Sending request with user_id:', userId); // Debug log
        }
        
        const response = await fetch('https://websecura.onrender.com/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status); // Debug log
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText); // Debug log
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data); // Debug log
        
        if (data.status === 'success') {
            // Display results
            displayScanResults(data);
            
            // Clear the input form after successful scan
            if (websiteUrl) {
                websiteUrl.value = '';
            }
            
            // Show success message if user is logged in
            if (userId) {
                console.log('Scan saved to history for user:', userId);
                // Optional: Show a brief notification
                showTempMessage('Scan completed and saved to your history!', 'success');
            }
        } else {
            throw new Error(data.error || 'Scan failed');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
        alert(`Scan failed: ${error.message}`);
    } finally {
        // Reset button
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

// Optional: Helper function to show temporary messages
function showTempMessage(message, type = 'info') {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

let currentScanData = null;

function displayScanResults(data) {
    // Store scan data globally for downloads
    currentScanData = data;
    
    // Remove the simple alert and create a beautiful results overlay
    createResultsOverlay(data);
}

function createResultsOverlay(data) {
    // Remove existing overlay if present
    const existingOverlay = document.getElementById('resultsOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const totalChecks = data.results.length;
    const passedChecks = data.results.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    // Determine overall status
    let overallStatus = 'success';
    let statusIcon = 'fas fa-shield-check';
    let statusText = 'Secure';
    
    if (failedChecks > 0) {
        if (failedChecks >= totalChecks * 0.5) {
            overallStatus = 'danger';
            statusIcon = 'fas fa-shield-exclamation';
            statusText = 'High Risk';
        } else {
            overallStatus = 'warning';
            statusIcon = 'fas fa-shield-alt';
            statusText = 'Needs Attention';
        }
    }
    
    // Create overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'resultsOverlay';
    overlay.className = 'results-overlay';
    
    overlay.innerHTML = generateResultsHTML(data, totalChecks, passedChecks, failedChecks, overallStatus, statusIcon, statusText);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Show with animation
    setTimeout(() => {
        overlay.classList.add('show');
    }, 100);
    
    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeResults();
        }
    });
    
    // Close on Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeResults();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Download Functions
function downloadJSON() {
    if (!currentScanData) {
        alert('No scan data available for download');
        return;
    }
    
    try {
        const jsonData = JSON.stringify(currentScanData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `websecura-scan-${getTimestamp()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('JSON report downloaded successfully');
    } catch (error) {
        console.error('Error downloading JSON:', error);
        alert('Failed to download JSON report');
    }
}

function downloadPDF() {
    if (!currentScanData) {
        alert('No scan data available for download');
        return;
    }
    
    try {
        // Create PDF content using jsPDF (we'll load it dynamically)
        if (typeof window.jspdf === 'undefined') {
            // Load jsPDF dynamically
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = function() {
                generatePDFReport();
            };
            script.onerror = function() {
                // Fallback: download as text file
                console.warn('jsPDF failed to load, downloading as text report');
                downloadTextReport();
            };
            document.head.appendChild(script);
        } else {
            generatePDFReport();
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        downloadTextReport();
    }
}

function downloadTextReport() {
    const data = currentScanData;
    const totalChecks = data.results.length;
    const passedChecks = data.results.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    let textContent = `WEBSECURA SECURITY REPORT\n`;
    textContent += `${'='.repeat(50)}\n\n`;
    textContent += `URL: ${data.url}\n`;
    textContent += `Scan Date: ${new Date(data.scan_time).toLocaleString()}\n`;
    textContent += `Total Checks: ${totalChecks}\n`;
    textContent += `Passed: ${passedChecks}\n`;
    textContent += `Failed: ${failedChecks}\n\n`;
    
    textContent += `DETAILED RESULTS\n`;
    textContent += `${'-'.repeat(30)}\n\n`;
    
    data.results.forEach((result, index) => {
        textContent += `${index + 1}. ${result.check}\n`;
        textContent += `   Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
        if (!result.passed && result.severity && result.severity !== 'none') {
            textContent += `   Severity: ${result.severity.toUpperCase()}\n`;
        }
        textContent += `   Description: ${result.description}\n`;
        if (result.details) {
            textContent += `   Details: ${result.details}\n`;
        }
        if (result.recommendation) {
            textContent += `   Recommendation: ${result.recommendation}\n`;
        }
        textContent += `\n`;
    });
    
    textContent += `\nGenerated by WebSecura Security Scanner\n`;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `websecura-scan-${getTimestamp()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Text report downloaded successfully');
}

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const data = currentScanData;
    const totalChecks = data.results.length;
    const passedChecks = data.results.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    // PDF Styling
    const primaryColor = [74, 222, 128]; // Green
    const dangerColor = [239, 68, 68]; // Red
    const warningColor = [251, 191, 36]; // Yellow
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('WebSecura Security Report', margin, yPosition);
    yPosition += 15;
    
    // URL and Date
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`URL: ${data.url}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Scan Date: ${new Date(data.scan_time).toLocaleString()}`, margin, yPosition);
    yPosition += 15;
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, contentWidth, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Scan Summary:', margin + 5, yPosition + 8);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`✓ Passed: ${passedChecks}`, margin + 5, yPosition + 16);
    
    doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
    doc.text(`✗ Failed: ${failedChecks}`, margin + 60, yPosition + 16);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: ${totalChecks}`, margin + 115, yPosition + 16);
    
    yPosition += 35;
    
    // Security Checks
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Security Check Results:', margin, yPosition);
    yPosition += 10;
    
    data.results.forEach((result, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Check header
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        const status = result.passed ? '✓' : '✗';
        const statusColor = result.passed ? primaryColor : dangerColor;
        
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(status, margin, yPosition);
        
        doc.setTextColor(0, 0, 0);
        doc.text(`${result.check}`, margin + 10, yPosition);
        
        // Severity badge
        if (!result.passed && result.severity && result.severity !== 'none') {
            const severityText = result.severity.toUpperCase();
            const severityColor = result.severity === 'high' ? dangerColor : 
                                 result.severity === 'medium' ? warningColor : primaryColor;
            
            doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
            doc.text(`[${severityText}]`, pageWidth - margin - 25, yPosition);
        }
        
        yPosition += 8;
        
        // Description
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(result.description, contentWidth - 10);
        doc.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 4;
        
        // Details
        if (result.details) {
            doc.setTextColor(50, 50, 50);
            const detailLines = doc.splitTextToSize(`Details: ${result.details}`, contentWidth - 10);
            doc.text(detailLines, margin + 5, yPosition);
            yPosition += detailLines.length * 4;
        }
        
        // Recommendation
        if (result.recommendation) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            const recommendationLines = doc.splitTextToSize(`Recommendation: ${result.recommendation}`, contentWidth - 10);
            doc.text(recommendationLines, margin + 5, yPosition);
            yPosition += recommendationLines.length * 4;
        }
        
        yPosition += 5;
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by WebSecura - Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`websecura-scan-${getTimestamp()}.pdf`);
    console.log('PDF report downloaded successfully');
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function generateResultsHTML(data, totalChecks, passedChecks, failedChecks, overallStatus, statusIcon, statusText) {
    return `
        <div class="results-container">
            <!-- Header -->
            <div class="results-header">
                <button class="results-close" onclick="closeResults()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="scan-status">
                    <div class="status-icon ${overallStatus}">
                        <i class="${statusIcon}"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold text-white mb-2">Security Scan Complete</h2>
                        <p class="text-xl logo-shield">${statusText}</p>
                    </div>
                </div>
                
                <div class="summary-and-downloads">
                    <div class="scan-summary">
                        <div class="summary-item">
                            <div class="summary-number total">${totalChecks}</div>
                            <div class="text-gray-300">Total Checks</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number passed">${passedChecks}</div>
                            <div class="text-gray-300">Passed</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number failed">${failedChecks}</div>
                            <div class="text-gray-300">Failed</div>
                        </div>
                    </div>
                    
                    <!-- Compact Download Buttons -->
                    <div class="download-buttons-compact">
                        <button onclick="downloadPDF()" class="download-btn-compact download-pdf-compact" title="Download PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button onclick="downloadJSON()" class="download-btn-compact download-json-compact" title="Download JSON">
                            <i class="fas fa-file-code"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Body -->
            <div class="results-body">
                <div class="scan-info">
                    <p class="text-gray-300 mb-2">
                        <i class="fas fa-globe mr-2"></i>
                        Scanned URL: <a href="${data.url}" target="_blank" class="scan-url">${data.url}</a>
                    </p>
                    <p class="text-gray-400 text-sm">
                        <i class="fas fa-clock mr-2"></i>
                        Scan completed at ${new Date(data.scan_time).toLocaleString()}
                    </p>
                </div>
                
                <div class="results-grid">
                    ${data.results.map(result => createResultCard(result)).join('')}
                </div>
            </div>
        </div>
    `;
}

function createResultCard(result) {
    const statusClass = result.passed ? 'passed' : 'failed';
    const statusIcon = result.passed ? 'fas fa-check-circle' : 'fas fa-times-circle';
    const statusText = result.passed ? 'Passed' : 'Failed';
    
    // Determine severity badge (only show for failed checks)
    let severityBadge = '';
    if (!result.passed && result.severity && result.severity !== 'none') {
        severityBadge = `<div class="severity-badge severity-${result.severity}">${result.severity}</div>`;
    }
    
    // Add recommendation section if available
    let recommendationSection = '';
    if (result.recommendation) {
        const recommendationClass = result.passed ? 'recommendation-success' : 'recommendation-action';
        const recommendationIcon = result.passed ? 'fas fa-check' : 'fas fa-lightbulb';
        
        recommendationSection = `
            <div class="result-recommendation ${recommendationClass}">
                <div class="recommendation-header">
                    <i class="${recommendationIcon} mr-2"></i>
                    <span class="font-semibold">${result.passed ? 'Status' : 'Recommendation'}</span>
                </div>
                <p class="recommendation-text">${result.recommendation}</p>
            </div>
        `;
    }
    
    return `
        <div class="result-card ${statusClass}">
            <div class="result-header">
                <div class="result-title-row">
                    <div class="result-title">
                        <div class="result-icon ${statusClass}">
                            <i class="${statusIcon}"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-white">${result.check}</h3>
                        </div>
                    </div>
                </div>
                
                <div class="result-status-row">
                    <div class="result-status ${statusClass}">
                        <i class="${statusIcon} text-sm"></i>
                        ${statusText}
                    </div>
                    ${severityBadge}
                </div>
            </div>
            
            <div class="result-description">
                ${result.description}
            </div>
            
            ${result.details ? `
                <div class="result-details">
                    ${result.details}
                </div>
            ` : ''}
            
            ${recommendationSection}
        </div>
    `;
}



function closeResults() {
    const overlay = document.getElementById('resultsOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Navigation menu functionality
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    
    if (!hamburgerBtn || !navMenu || !menuOverlay) {
        return; // Exit if required elements don't exist
    }
    
    function openMenu() {
        navMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        navMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Add click event to hamburger
    hamburgerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openMenu();
    });
    
    // Add click event to close button
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        });
    }
    
    // Add click event to overlay
    menuOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
    });
    
    // Close menu when clicking nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', closeMenu);
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Contact Form Functionality - Only for contact page
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    
    if (!contactForm) return; // Exit if contact form doesn't exist
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        // Validate form
        if (validateContactForm(formObject)) {
            // Simulate form submission
            submitContactForm(formObject);
        }
    });
    
    // Add input animations
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

function validateContactForm(data) {
    // Basic validation
    if (!data.name || data.name.trim().length < 2) {
        showFormError('Please enter a valid name (at least 2 characters)');
        return false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showFormError('Please enter a valid email address');
        return false;
    }
    
    if (!data.subject) {
        showFormError('Please select a subject');
        return false;
    }
    
    if (!data.message || data.message.trim().length < 10) {
        showFormError('Please enter a message (at least 10 characters)');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFormError(message) {
    // Create or update error message
    let errorDiv = document.getElementById('formError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'formError';
        errorDiv.className = 'form-error';
        errorDiv.style.cssText = `
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 1rem;
            border-radius: 0.75rem;
            margin-top: 1rem;
            text-align: center;
            animation: errorShake 0.5s ease-in-out;
        `;
        document.getElementById('contactForm').appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}

function submitContactForm(data) {
    const submitButton = document.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showSuccessMessage();
        
        // Reset form
        document.getElementById('contactForm').reset();
        
        // Hide any error messages
        const errorDiv = document.getElementById('formError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
    }, 2000);
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.classList.remove('hidden');
        successMessage.classList.add('show');
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            successMessage.classList.add('hidden');
            successMessage.classList.remove('show');
        }, 5000);
        
        // Close on click
        successMessage.addEventListener('click', function() {
            this.classList.add('hidden');
            this.classList.remove('show');
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initHamburgerMenu();
    initSearchFunctionality();
    initContactForm();
});

// Also try immediately in case DOM is already ready
initHamburgerMenu();
initSearchFunctionality();
initContactForm();

// Add error shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

//-----------------Authentication functionality ------------------//
const BACKEND_URL = window.location.hostname.includes('localhost')
  ? 'http://127.0.0.1:8000'
  : 'https://websecura.onrender.com';

let isLoginMode = true;

// Check authentication status using localStorage
function checkAuthStatus() {
    try {
        const userStr = localStorage.getItem('webSecuraUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            updateNavigationForLoggedInUser(user);
            return user;
        } else {
            updateNavigationForGuest();
            return null;
        }
    } catch (error) {
        console.log('Auth check failed:', error);
        localStorage.removeItem('webSecuraUser'); // Clear corrupted data
        updateNavigationForGuest();
        return null;
    }
}

// Update navigation menu for logged-in users
function updateNavigationForLoggedInUser(user) {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        // Find the navigation items container
        const navContainer = navMenu.querySelector('.mt-16') || navMenu.querySelector('div');
        
        if (navContainer) {
            navContainer.innerHTML = `
                <a href="index.html" class="nav-item">
                    <i class="fas fa-home mr-3"></i>Home
                </a>
                <a href="about.html" class="nav-item">
                    <i class="fas fa-info-circle mr-3"></i>About
                </a>
                <a href="contact.html" class="nav-item">
                    <i class="fas fa-envelope mr-3"></i>Contact
                </a>
                <a href="history.html" class="nav-item">
                    <i class="fas fa-history mr-3"></i>Scan History
                </a>
                <a href="profile.html" class="nav-item">
                    <i class="fas fa-user mr-3"></i>Profile
                </a>
                <a href="#" class="nav-item" onclick="logout()">
                    <i class="fas fa-sign-out-alt mr-3"></i>Logout
                </a>
                <div class="nav-user-info">
                    <i class="fas fa-user-circle mr-2"></i>
                    <span>Welcome, ${user.username || user.email}</span>
                </div>
            `;
        }
    }
    
    // Update any user display elements
    const userDisplays = document.querySelectorAll('.user-display');
    userDisplays.forEach(el => {
        el.textContent = user.username || user.email;
        el.style.display = 'block';
    });
}

// Update navigation menu for guests
function updateNavigationForGuest() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        const navContainer = navMenu.querySelector('.mt-16') || navMenu.querySelector('div');
        
        if (navContainer) {
            navContainer.innerHTML = `
                <a href="index.html" class="nav-item">
                    <i class="fas fa-home mr-3"></i>Home
                </a>
                <a href="about.html" class="nav-item">
                    <i class="fas fa-info-circle mr-3"></i>About
                </a>
                <a href="contact.html" class="nav-item">
                    <i class="fas fa-envelope mr-3"></i>Contact
                </a>
                <a href="auth.html" class="nav-item">
                    <i class="fas fa-sign-in-alt mr-3"></i>Login
                </a>
            `;
        }
    }
    
    // Hide user display elements
    const userDisplays = document.querySelectorAll('.user-display');
    userDisplays.forEach(el => {
        el.style.display = 'none';
    });
}

// Logout function
async function logout() {
    try {
        // Try to logout from server (but don't fail if it doesn't work due to CORS)
        fetch(BACKEND_URL + '/api/logout', {
            method: 'POST'
        }).catch(console.warn); // Don't let CORS errors break logout
        
        // Always clear local storage and update navigation
        localStorage.removeItem('webSecuraUser');
        updateNavigationForGuest();
        
        // Redirect to home
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout failed:', error);
        // Force logout locally
        localStorage.removeItem('webSecuraUser');
        updateNavigationForGuest();
        window.location.href = 'index.html';
    }
}

// Basic utility functions
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('auth-message');
    const textEl = document.getElementById('message-text');
    
    if (messageEl && textEl) {
        textEl.textContent = text;
        messageEl.className = `auth-message show ${type}`;
        messageEl.style.display = 'block';
    }
}

function hideMessage() {
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.className = 'auth-message hidden';
        messageEl.style.display = 'none';
    }
}

function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(fieldId + '-eye');
    
    if (passwordField && eyeIcon) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            eyeIcon.className = 'fas fa-eye-slash';
        } else {
            passwordField.type = 'password';
            eyeIcon.className = 'fas fa-eye';
        }
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    const usernameGroup = document.getElementById('username-group');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const submitIcon = document.getElementById('submit-icon');
    const submitText = document.getElementById('submit-text');
    const toggleQuestion = document.getElementById('toggle-question');
    const toggleText = document.getElementById('toggle-text');
    
    if (isLoginMode) {
        // Login Mode
        usernameGroup.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to access your security dashboard';
        submitIcon.className = 'fas fa-sign-in-alt mr-2';
        submitText.textContent = 'Sign In';
        toggleQuestion.textContent = "Don't have an account?";
        toggleText.textContent = 'Create Account';
        
        document.getElementById('username').required = false;
        document.getElementById('confirm-password').required = false;
    } else {
        // Register Mode
        usernameGroup.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join WebSecura to track your security scans';
        submitIcon.className = 'fas fa-user-plus mr-2';
        submitText.textContent = 'Create Account';
        toggleQuestion.textContent = 'Already have an account?';
        toggleText.textContent = 'Sign In';
        
        document.getElementById('username').required = true;
        document.getElementById('confirm-password').required = true;
    }
    
    document.getElementById('authForm').reset();
    hideMessage();
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!isLoginMode) {
        if (!data.username?.trim()) {
            showMessage('Username is required', 'error');
            return;
        }
        if (data.password !== data['confirm-password']) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        if (data.password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
    }
    
    if (!data.email?.trim() || !data.password) {
        showMessage('Email and password are required', 'error');
        return;
    }

    const submitBtn = document.getElementById('auth-submit');
    const originalHTML = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
        submitBtn.disabled = true;
        hideMessage();
        
        const endpoint = isLoginMode ? '/api/login' : '/api/register';
        const requestBody = isLoginMode ? {
            email: data.email.trim(),
            password: data.password
        } : {
            username: data.username.trim(),
            email: data.email.trim(),
            password: data.password
        };
        
        const response = await fetch(BACKEND_URL + endpoint, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // Remove credentials to avoid CORS issues for now
            body: JSON.stringify(requestBody)
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const htmlText = await response.text();
            console.error('Received HTML instead of JSON:', htmlText.substring(0, 200));
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(result.message || 'Success!', 'success');
            
            if (result.user) {
                // Store user data in localStorage
                localStorage.setItem('webSecuraUser', JSON.stringify(result.user));
                
                // Update navigation immediately
                updateNavigationForLoggedInUser(result.user);
            }
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage(result.error || 'Authentication failed', 'error');
        }
        
    } catch (error) {
        console.error('Full error:', error);
        if (error.message.includes('Failed to fetch')) {
            showMessage('Cannot connect to server. Please check your internet connection.', 'error');
        } else if (error.message.includes('HTML instead of JSON')) {
            showMessage('Server configuration error. Please try again later.', 'error');
        } else {
            showMessage('Error: ' + error.message, 'error');
        }
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

// Initialize functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status on every page using localStorage
    checkAuthStatus();
    
    // Only run auth form logic on auth page
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
        console.log('WebSecura auth initialized');
    }
});

// Make functions available globally
window.togglePassword = togglePassword;
window.toggleAuthMode = toggleAuthMode;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus;


// ==================== PROFILE PAGE FUNCTIONS ====================

// Show profile messages
function showProfileMessage(text, type = 'info') {
    const messageEl = document.getElementById('profile-message');
    const textEl = document.getElementById('profile-message-text');
    
    if (messageEl && textEl) {
        textEl.textContent = text;
        messageEl.className = `auth-message show ${type}`;
        messageEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageEl.className = 'auth-message hidden';
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Load user profile data
async function loadProfile() {
    const userStr = localStorage.getItem('webSecuraUser');
    if (!userStr) {
        window.location.href = 'auth.html';
        return;
    }
    
    let currentUser;
    try {
        currentUser = JSON.parse(userStr);
    } catch (error) {
        console.error('Invalid user data:', error);
        localStorage.removeItem('webSecuraUser');
        window.location.href = 'auth.html';
        return;
    }

    // Fill form with current data
    if (document.getElementById('username')) {
        document.getElementById('username').value = currentUser.username || '';
    }
    if (document.getElementById('email')) {
        document.getElementById('email').value = currentUser.email || '';
    }

    try {
        const response = await fetch(BACKEND_URL + '/api/profile');
        
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                // Update form with server data
                if (document.getElementById('username')) {
                    document.getElementById('username').value = data.user.username || '';
                }
                if (document.getElementById('email')) {
                    document.getElementById('email').value = data.user.email || '';
                }
                
                // Format member since date
                if (data.user.created_at && document.getElementById('member-since')) {
                    const date = new Date(data.user.created_at);
                    document.getElementById('member-since').textContent = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
                
                // Load statistics
                loadStatistics(data.statistics);
            }
        } else {
            // Fallback to localStorage data
            if (document.getElementById('member-since')) {
                document.getElementById('member-since').textContent = 'Unknown';
            }
            loadStatistics(null);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        if (document.getElementById('member-since')) {
            document.getElementById('member-since').textContent = 'Unknown';
        }
        loadStatistics(null);
    }
}

// Load statistics for profile page
function loadStatistics(stats) {
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    if (!stats || stats.total_scans === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-chart-line text-4xl text-gray-500 mb-4"></i>
                <h3 class="text-lg font-semibold mb-2">No scans yet</h3>
                <p class="text-gray-400 mb-4">Start scanning websites to see your statistics here</p>
                <a href="index.html" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Run Your First Scan
                </a>
            </div>
        `;
        return;
    }

    const successRate = stats.total_checks > 0 ? Math.round((stats.total_passed / stats.total_checks) * 100) : 0;
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="stat-card">
                <div class="stat-number">${stats.total_scans}</div>
                <div class="stat-label">Total Scans</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total_checks}</div>
                <div class="stat-label">Security Checks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-green-400">${stats.total_passed}</div>
                <div class="stat-label">Checks Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-red-400">${stats.total_failed}</div>
                <div class="stat-label">Issues Found</div>
            </div>
        </div>
        
        <div class="mt-6 p-4 bg-gray-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">Overall Security Score</span>
                <span class="text-sm font-medium">${successRate}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style="width: ${successRate}%"></div>
            </div>
        </div>
        
        ${stats.first_scan ? `
        <div class="text-center text-sm text-gray-400">
            <i class="fas fa-clock mr-1"></i>
            First scan: ${new Date(stats.first_scan).toLocaleDateString()}
            ${stats.last_scan ? `<br><i class="fas fa-calendar mr-1"></i>Last scan: ${new Date(stats.last_scan).toLocaleDateString()}` : ''}
        </div>
        ` : ''}
    `;
}

// Handle profile update
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Validation
    if (!data.username?.trim()) {
        showProfileMessage('Username is required', 'error');
        return;
    }
    
    if (data['new-password'] && data['new-password'].length < 6) {
        showProfileMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    const submitBtn = document.getElementById('update-profile-btn');
    const originalHTML = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Updating...';
        submitBtn.disabled = true;
        
        const updateData = {
            username: data.username.trim()
        };
        
        if (data['new-password']) {
            updateData.password = data['new-password'];
        }
        
        const response = await fetch(BACKEND_URL + '/api/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showProfileMessage(result.message || 'Profile updated successfully!', 'success');
            
            // Update localStorage
            const userStr = localStorage.getItem('webSecuraUser');
            if (userStr) {
                const currentUser = JSON.parse(userStr);
                currentUser.username = data.username.trim();
                localStorage.setItem('webSecuraUser', JSON.stringify(currentUser));
            }
            
            // Clear password field
            if (document.getElementById('new-password')) {
                document.getElementById('new-password').value = '';
            }
            
            // Update navigation if needed
            if (window.checkAuthStatus) {
                window.checkAuthStatus();
            }
        } else {
            showProfileMessage(result.error || 'Failed to update profile', 'error');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showProfileMessage('Failed to update profile. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

// ==================== HISTORY PAGE FUNCTIONS ====================

// History page variables
let allScans = [];
let currentPage = 1;
const scansPerPage = 10;

// Show history messages
function showHistoryMessage(text, type = 'info') {
    const messageEl = document.getElementById('history-message');
    const textEl = document.getElementById('history-message-text');
    
    if (messageEl && textEl) {
        textEl.textContent = text;
        messageEl.className = `auth-message show ${type}`;
        messageEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageEl.className = 'auth-message hidden';
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Load scan history
async function loadHistory() {
    const userStr = localStorage.getItem('webSecuraUser');
    if (!userStr) {
        window.location.href = 'auth.html';
        return;
    }

    let currentUser;
    try {
        currentUser = JSON.parse(userStr);
    } catch (error) {
        localStorage.removeItem('webSecuraUser');
        window.location.href = 'auth.html';
        return;
    }

    try {
        // Pass user_id as query parameter
        const response = await fetch(BACKEND_URL + `/api/history?user_id=${currentUser.id}`);
        
        if (response.ok) {
            const data = await response.json();
            allScans = data.scans || [];
            displayScans();
        } else if (response.status === 401) {
            showHistoryMessage('Please log in to view your scan history', 'error');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        } else {
            throw new Error('Failed to load history');
        }
    } catch (error) {
        console.error('Failed to load history:', error);
        showHistoryMessage('Failed to load scan history. Please try again.', 'error');
        displayEmptyState();
    }
}

// Display scans
function displayScans(scansToShow = null) {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    const scans = scansToShow || allScans;
    
    if (scans.length === 0) {
        displayEmptyState();
        return;
    }

    const startIndex = (currentPage - 1) * scansPerPage;
    const endIndex = startIndex + scansPerPage;
    const paginatedScans = scans.slice(startIndex, endIndex);

    container.innerHTML = paginatedScans.map(scan => {
        const scanDate = new Date(scan.scan_time);
        const successRate = scan.total_checks > 0 ? Math.round((scan.passed_checks / scan.total_checks) * 100) : 0;
        const statusColor = successRate >= 80 ? 'text-green-400' : successRate >= 60 ? 'text-yellow-400' : 'text-red-400';
        const statusIcon = successRate >= 80 ? 'fa-shield-alt' : successRate >= 60 ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
        
        return `
            <div class="scan-history-card" onclick="viewScanDetails(${scan.id})">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fas ${statusIcon} ${statusColor}"></i>
                            <h3 class="text-lg font-semibold truncate">${scan.url}</h3>
                        </div>
                        <div class="flex items-center gap-6 text-sm text-gray-400">
                            <span>
                                <i class="fas fa-calendar mr-1"></i>
                                ${scanDate.toLocaleDateString()} ${scanDate.toLocaleTimeString()}
                            </span>
                            <span>
                                <i class="fas fa-check-circle mr-1 text-green-400"></i>
                                ${scan.passed_checks}/${scan.total_checks} passed
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <div class="text-xl font-bold ${statusColor}">${successRate}%</div>
                            <div class="text-xs text-gray-400">Security</div>
                        </div>
                        <div class="flex gap-2">
                            <button 
                                onclick="event.stopPropagation(); viewScanDetails(${scan.id})" 
                                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                            >
                                <i class="fas fa-eye mr-1"></i>View
                            </button>
                            <button 
                                onclick="event.stopPropagation(); deleteScan(${scan.id})" 
                                class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                            >
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    displayPagination(scans.length);
}

// Display empty state
function displayEmptyState() {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-history text-6xl text-gray-500 mb-6"></i>
            <h3 class="text-2xl font-semibold mb-4">No scan history yet</h3>
            <p class="text-gray-400 mb-6">Start scanning websites to build your security history</p>
            <a href="index.html" class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg transition-colors">
                <i class="fas fa-shield-alt mr-2"></i>
                Run Your First Scan
            </a>
        </div>
    `;
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

// Display pagination
function displayPagination(totalScans) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    const totalPages = Math.ceil(totalScans / scansPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let pagination = '<div class="flex items-center gap-2">';
    
    // Previous button
    if (currentPage > 1) {
        pagination += `
            <button onclick="changePage(${currentPage - 1})" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            pagination += `
                <button class="px-3 py-2 bg-blue-600 text-white rounded">${i}</button>
            `;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagination += `
                <button onclick="changePage(${i})" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">${i}</button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagination += '<span class="px-2 text-gray-400">...</span>';
        }
    }

    // Next button
    if (currentPage < totalPages) {
        pagination += `
            <button onclick="changePage(${currentPage + 1})" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    pagination += '</div>';
    container.innerHTML = pagination;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayScans();
}

// Filter scans
function filterScans() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filteredScans = allScans.filter(scan => 
        scan.url.toLowerCase().includes(searchTerm)
    );
    currentPage = 1; // Reset to first page
    displayScans(filteredScans);
}

// View scan details
async function viewScanDetails(scanId) {
    try {
        const response = await fetch(BACKEND_URL + `/api/history/${scanId}`);
        
        if (response.ok) {
            const scanData = await response.json();
            displayScanModal(scanData);
        } else {
            showHistoryMessage('Failed to load scan details', 'error');
        }
    } catch (error) {
        console.error('Failed to load scan details:', error);
        showHistoryMessage('Failed to load scan details', 'error');
    }
}

// Display scan modal
function displayScanModal(scanData) {
    const modal = document.getElementById('scan-modal');
    const content = document.getElementById('scan-modal-content');
    
    if (!modal || !content) return;
    
    const scanDate = new Date(scanData.scan_time);
    const successRate = scanData.summary.total_checks > 0 ? 
        Math.round((scanData.summary.passed_checks / scanData.summary.total_checks) * 100) : 0;
    
    content.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-bold mb-2">${scanData.url}</h3>
            <div class="flex items-center gap-4 text-sm text-gray-400">
                <span>
                    <i class="fas fa-calendar mr-1"></i>
                    ${scanDate.toLocaleDateString()} ${scanDate.toLocaleTimeString()}
                </span>
                <span>
                    <i class="fas fa-shield-alt mr-1"></i>
                    Security Score: ${successRate}%
                </span>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="stat-card">
                <div class="stat-number">${scanData.summary.total_checks}</div>
                <div class="stat-label">Total Checks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-green-400">${scanData.summary.passed_checks}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number text-red-400">${scanData.summary.failed_checks}</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>

        <div class="space-y-4">
            <h4 class="text-lg font-semibold mb-4">Detailed Results</h4>
            ${scanData.results.map(result => `
                <div class="result-card ${result.passed ? 'border-green-500' : 'border-red-500'}">
                    <div class="flex items-start gap-3">
                        <i class="fas ${result.passed ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} mt-1"></i>
                        <div class="flex-1">
                            <h5 class="font-semibold mb-1">${result.check}</h5>
                            <p class="text-gray-300 text-sm mb-2">${result.description}</p>
                            ${result.details ? `<p class="text-xs text-gray-400">${result.details}</p>` : ''}
                            ${!result.passed && result.recommendation ? `
                                <div class="mt-2 p-2 bg-blue-900 bg-opacity-50 rounded border-l-2 border-blue-400">
                                    <p class="text-sm"><strong>Recommendation:</strong> ${result.recommendation}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close scan modal
function closeScanModal() {
    const modal = document.getElementById('scan-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Delete scan
async function deleteScan(scanId) {
    if (!confirm('Are you sure you want to delete this scan? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(BACKEND_URL + `/api/history/${scanId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showHistoryMessage('Scan deleted successfully', 'success');
            loadHistory(); // Reload the history
        } else {
            showHistoryMessage('Failed to delete scan', 'error');
        }
    } catch (error) {
        console.error('Failed to delete scan:', error);
        showHistoryMessage('Failed to delete scan', 'error');
    }
}

// ==================== PAGE INITIALIZATION ====================

// Auto-initialize based on page elements
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on profile page
    if (document.getElementById('profileForm')) {
        loadProfile();
        
        const profileForm = document.getElementById('profileForm');
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Check if we're on history page
    if (document.getElementById('history-container')) {
        loadHistory();
        
        // Close modal when clicking outside
        const modal = document.getElementById('scan-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeScanModal();
                }
            });
        }
    }
});