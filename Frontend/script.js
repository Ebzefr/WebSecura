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
// Updated Search functionality - Replace in your script.js
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
    const originalText = searchBtn.innerHTML;
    
    try {
        // Show loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Scanning...';
        searchBtn.disabled = true;
        
        console.log('Starting scan for:', url); // Debug log
        
        // Call Flask backend API - USE FULL URL TO FLASK SERVER
        const response = await fetch('http://localhost:8000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ url: url })
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
            websiteUrl.value = '';
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

function displayScanResults(data) {
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