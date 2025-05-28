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

// Search functionality - Only for home page
function initSearchFunctionality() {
    const searchBtn = document.getElementById('searchBtn');
    const websiteUrl = document.getElementById('websiteUrl');
    
    if (searchBtn && websiteUrl) {
        // Search button click
        searchBtn.addEventListener('click', function() {
            const url = websiteUrl.value;
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
            
            // Placeholder for search functionality
            alert('Search functionality will be implemented next!');
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