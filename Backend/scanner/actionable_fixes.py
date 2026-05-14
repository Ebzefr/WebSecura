ACTIONABLE_FIXES = {
    'https_encryption': {
        'issue': 'Website not using HTTPS',
        'risk': 'HIGH - Attackers can intercept user data, steal passwords, inject malware',
        'how_to_fix': {
            'general': [
                '1. Get a free SSL certificate from Let\'s Encrypt',
                '2. Install the certificate on your web server',
                '3. Redirect all HTTP traffic to HTTPS'
            ],
            'nginx': '''# Add to your nginx config:
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
}''',
            'apache': '''# Add to .htaccess or Apache config:
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Enable SSL module:
# a2enmod ssl
# systemctl restart apache2''',
            'cloudflare': 'Go to cloudflare.com → SSL/TLS → Set to "Full (strict)" → Enable "Always Use HTTPS"',
            'vercel': 'HTTPS is automatic on Vercel - no action needed',
            'netlify': 'HTTPS is automatic on Netlify - no action needed'
        },
        'verification': 'Visit https://yourdomain.com - should load without warnings',
        'cost': 'FREE',
        'time': '15-30 minutes'
    },
    
    'hsts': {
        'issue': 'HTTP Strict Transport Security (HSTS) not enabled',
        'risk': 'MEDIUM - Vulnerable to SSL stripping attacks, downgrade attacks',
        'how_to_fix': {
            'nginx': '''# Add to nginx server block:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;''',
            'apache': '''# Add to Apache config or .htaccess:
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"''',
            'express': '''// Add to Express.js app:
const helmet = require('helmet');
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
}));''',
            'cloudflare': 'Cloudflare → SSL/TLS → Edge Certificates → Enable HSTS',
        },
        'verification': 'Check headers at securityheaders.com',
        'cost': 'FREE',
        'time': '5 minutes'
    },
    
    'x_xss_protection': {
        'issue': 'X-XSS-Protection header missing',
        'risk': 'MEDIUM - Vulnerable to cross-site scripting attacks',
        'how_to_fix': {
            'nginx': '''# Add to nginx config:
add_header X-XSS-Protection "1; mode=block" always;''',
            'apache': '''# Add to .htaccess:
Header set X-XSS-Protection "1; mode=block"''',
            'express': '''// Use helmet middleware:
app.use(helmet.xssFilter());''',
            'nextjs': '''// Add to next.config.js:
module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-XSS-Protection', value: '1; mode=block' }
      ]
    }]
  }
}'''
        },
        'verification': 'Check response headers in browser DevTools → Network tab',
        'cost': 'FREE',
        'time': '2 minutes'
    },
    
    'content_security_policy': {
        'issue': 'Content Security Policy (CSP) not configured',
        'risk': 'HIGH - Vulnerable to XSS, code injection, clickjacking',
        'how_to_fix': {
            'nginx': '''# Add to nginx (start restrictive, then loosen):
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;''',
            'express': '''// Use helmet:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));''',
            'apache': '''# Add to Apache config:
Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"''',
        },
        'warning': '⚠️ CSP can break your site if misconfigured. Test thoroughly in report-only mode first!',
        'verification': 'Use csp-evaluator.withgoogle.com to validate your policy',
        'cost': 'FREE',
        'time': '30-60 minutes'
    },
    
    'x_frame_options': {
        'issue': 'X-Frame-Options header missing',
        'risk': 'MEDIUM - Vulnerable to clickjacking attacks',
        'how_to_fix': {
            'nginx': '''# Add to nginx:
add_header X-Frame-Options "SAMEORIGIN" always;''',
            'apache': '''# Add to .htaccess:
Header always set X-Frame-Options "SAMEORIGIN"''',
            'express': '''app.use(helmet.frameguard({ action: 'sameorigin' }));''',
        },
        'verification': 'Try embedding your site in an iframe on another domain - should be blocked',
        'cost': 'FREE',
        'time': '2 minutes'
    },
    
    'x_content_type_options': {
        'issue': 'X-Content-Type-Options header missing',
        'risk': 'LOW - Browsers may incorrectly interpret file types',
        'how_to_fix': {
            'nginx': "add_header X-Content-Type-Options 'nosniff' always;",
            'apache': "Header set X-Content-Type-Options 'nosniff'",
            'express': "app.use(helmet.noSniff());",
        },
        'verification': 'Check response headers in DevTools',
        'cost': 'FREE',
        'time': '1 minute'
    },
    
    'secure_cookies': {
        'issue': 'Cookies not marked as Secure and HttpOnly',
        'risk': 'MEDIUM - Cookies can be stolen over unencrypted connections or via JavaScript',
        'how_to_fix': {
            'express': '''// Set secure cookie options:
app.use(session({
  cookie: {
    secure: true,      // Only HTTPS
    httpOnly: true,    // No JavaScript access
    sameSite: 'strict' // CSRF protection
  }
}));''',
            'php': '''// Set in PHP:
session_set_cookie_params([
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);''',
            'django': '''# In settings.py:
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True''',
        },
        'verification': 'Check cookies in DevTools → Application → Cookies',
        'cost': 'FREE',
        'time': '5 minutes'
    },
}

def get_fix_for_check(check_name):
    """
    Get actionable fix instructions for a security check
    
    Args:
        check_name: Name of the security check (lowercase, underscores)
    
    Returns:
        dict: Fix instructions or empty dict if not found
    """
    # Normalize check name
    normalized = check_name.lower().replace(' ', '_').replace('-', '_')
    return ACTIONABLE_FIXES.get(normalized, {})