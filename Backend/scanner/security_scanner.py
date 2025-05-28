import requests
import ssl
import socket
from urllib.parse import urlparse
import re
from typing import List, Dict, Any
import warnings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Suppress SSL warnings for testing
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

class SecurityScanner:
    def __init__(self):
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set user agent
        self.session.headers.update({
            'User-Agent': 'WebSecura-Scanner/1.0 (Security Testing Tool)'
        })

    def scan_website(self, url: str) -> List[Dict[str, Any]]:
        """
        Perform comprehensive security scan on the given URL
        """
        results = []
        
        try:
            # Make initial request
            response = self.session.get(url, timeout=10, verify=False)
            headers = response.headers
            
            # 1. HTTPS Check
            results.append(self._check_https(url))
            
            # 2. Security Headers
            results.extend(self._check_security_headers(headers))
            
            # 3. Server Information Disclosure
            results.append(self._check_server_info(headers))
            
            # 4. SSL/TLS Configuration
            results.append(self._check_ssl_config(url))
            
            # 5. XSS Protection
            results.append(self._check_xss_protection(headers, response.text))
            
            # 6. Content Security Policy
            results.append(self._check_csp(headers))
            
            # 7. Cookie Security
            results.append(self._check_cookie_security(headers))
            
            # 8. Clickjacking Protection
            results.append(self._check_clickjacking(headers))
            
        except requests.exceptions.RequestException as e:
            results.append({
                'check': 'Website Accessibility',
                'description': 'Check if the website is accessible and responding',
                'passed': False,
                'details': f'Failed to access website: {str(e)}',
                'severity': 'high'
            })
        
        return results

    def _check_https(self, url: str) -> Dict[str, Any]:
        """Check if the website uses HTTPS"""
        is_https = url.lower().startswith('https://')
        
        return {
            'check': 'HTTPS Encryption',
            'description': 'Ensures data transmission is encrypted using HTTPS protocol',
            'passed': is_https,
            'details': 'Website uses HTTPS encryption ✓' if is_https else 'Website does not use HTTPS - data transmission is not encrypted ⚠️',
            'severity': 'high' if not is_https else 'none'
        }

    def _check_security_headers(self, headers: Dict[str, str]) -> List[Dict[str, Any]]:
        """Check for important security headers"""
        checks = []
        
        # Strict Transport Security (HSTS)
        hsts = headers.get('strict-transport-security') or headers.get('Strict-Transport-Security')
        checks.append({
            'check': 'HTTP Strict Transport Security (HSTS)',
            'description': 'Forces browsers to use HTTPS connections only',
            'passed': bool(hsts),
            'details': f'HSTS Header: {hsts}' if hsts else 'No HSTS header found - browsers may connect via HTTP',
            'severity': 'medium' if not hsts else 'none'
        })
        
        # X-Content-Type-Options
        xcto = headers.get('x-content-type-options') or headers.get('X-Content-Type-Options')
        checks.append({
            'check': 'X-Content-Type-Options',
            'description': 'Prevents MIME type sniffing attacks',
            'passed': bool(xcto and 'nosniff' in xcto.lower()),
            'details': f'X-Content-Type-Options: {xcto}' if xcto else 'No X-Content-Type-Options header found',
            'severity': 'medium' if not xcto else 'none'
        })
        
        # X-Frame-Options
        xfo = headers.get('x-frame-options') or headers.get('X-Frame-Options')
        checks.append({
            'check': 'X-Frame-Options',
            'description': 'Prevents clickjacking attacks by controlling iframe embedding',
            'passed': bool(xfo and xfo.upper() in ['DENY', 'SAMEORIGIN']),
            'details': f'X-Frame-Options: {xfo}' if xfo else 'No X-Frame-Options header found',
            'severity': 'medium' if not xfo else 'none'
        })
        
        return checks

    def _check_server_info(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Check for server information disclosure"""
        server_header = headers.get('server') or headers.get('Server')
        x_powered_by = headers.get('x-powered-by') or headers.get('X-Powered-By')
        
        exposed_info = []
        if server_header:
            exposed_info.append(f"Server: {server_header}")
        if x_powered_by:
            exposed_info.append(f"X-Powered-By: {x_powered_by}")
        
        is_secure = len(exposed_info) == 0
        
        return {
            'check': 'Server Information Disclosure',
            'description': 'Checks if server details are hidden from potential attackers',
            'passed': is_secure,
            'details': 'No server information exposed ✓' if is_secure else f'Server information exposed: {", ".join(exposed_info)}',
            'severity': 'low' if not is_secure else 'none'
        }

    def _check_ssl_config(self, url: str) -> Dict[str, Any]:
        """Check SSL/TLS configuration"""
        if not url.startswith('https://'):
            return {
                'check': 'SSL/TLS Configuration',
                'description': 'Validates SSL certificate and TLS configuration',
                'passed': False,
                'details': 'Website does not use HTTPS',
                'severity': 'high'
            }
        
        try:
            parsed_url = urlparse(url)
            hostname = parsed_url.hostname
            port = parsed_url.port or 443
            
            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    protocol = ssock.version()
                    
            return {
                'check': 'SSL/TLS Configuration',
                'description': 'Validates SSL certificate and TLS configuration',
                'passed': True,
                'details': f'Valid SSL certificate found ✓ | TLS Version: {protocol}',
                'severity': 'none'
            }
            
        except Exception as e:
            return {
                'check': 'SSL/TLS Configuration',
                'description': 'Validates SSL certificate and TLS configuration',
                'passed': False,
                'details': f'SSL/TLS configuration issue: {str(e)}',
                'severity': 'high'
            }

    def _check_xss_protection(self, headers: Dict[str, str], content: str) -> Dict[str, Any]:
        """Check for XSS protection mechanisms"""
        xss_protection = headers.get('x-xss-protection') or headers.get('X-XSS-Protection')
        
        # Basic XSS pattern detection
        xss_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
        ]
        
        potential_xss = any(re.search(pattern, content, re.IGNORECASE) for pattern in xss_patterns[:2])
        
        has_protection = bool(xss_protection and '1' in xss_protection)
        
        details = []
        if xss_protection:
            details.append(f"X-XSS-Protection: {xss_protection}")
        else:
            details.append("No X-XSS-Protection header found")
        
        if potential_xss:
            details.append("Potential XSS patterns detected in content")
        
        return {
            'check': 'XSS Protection',
            'description': 'Checks for Cross-Site Scripting protection mechanisms',
            'passed': has_protection and not potential_xss,
            'details': " | ".join(details),
            'severity': 'high' if potential_xss else 'medium' if not has_protection else 'none'
        }

    def _check_csp(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Check Content Security Policy"""
        csp = headers.get('content-security-policy') or headers.get('Content-Security-Policy')
        
        return {
            'check': 'Content Security Policy (CSP)',
            'description': 'Prevents XSS attacks by controlling resource loading',
            'passed': bool(csp),
            'details': f'CSP Header found ✓' if csp else 'No Content Security Policy header found',
            'severity': 'medium' if not csp else 'none'
        }

    def _check_cookie_security(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Check cookie security attributes"""
        set_cookie = headers.get('set-cookie') or headers.get('Set-Cookie')
        
        if not set_cookie:
            return {
                'check': 'Cookie Security',
                'description': 'Checks for secure cookie attributes',
                'passed': True,
                'details': 'No cookies set by the server',
                'severity': 'none'
            }
        
        secure_flags = ['Secure', 'HttpOnly', 'SameSite']
        missing_flags = []
        
        for flag in secure_flags:
            if flag not in set_cookie:
                missing_flags.append(flag)
        
        is_secure = len(missing_flags) == 0
        
        return {
            'check': 'Cookie Security',
            'description': 'Checks for secure cookie attributes (Secure, HttpOnly, SameSite)',
            'passed': is_secure,
            'details': 'All security flags present ✓' if is_secure else f'Missing security flags: {", ".join(missing_flags)}',
            'severity': 'medium' if not is_secure else 'none'
        }

    def _check_clickjacking(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Check for clickjacking protection"""
        x_frame_options = headers.get('x-frame-options') or headers.get('X-Frame-Options')
        csp = headers.get('content-security-policy') or headers.get('Content-Security-Policy')
        
        # Check if CSP has frame-ancestors directive
        csp_protection = bool(csp and 'frame-ancestors' in csp.lower())
        xfo_protection = bool(x_frame_options and x_frame_options.upper() in ['DENY', 'SAMEORIGIN'])
        
        has_protection = xfo_protection or csp_protection
        
        details = []
        if x_frame_options:
            details.append(f"X-Frame-Options: {x_frame_options}")
        if csp_protection:
            details.append("CSP frame-ancestors directive found")
        if not has_protection:
            details.append("No clickjacking protection found")
        
        return {
            'check': 'Clickjacking Protection',
            'description': 'Prevents the website from being embedded in malicious frames',
            'passed': has_protection,
            'details': " | ".join(details),
            'severity': 'medium' if not has_protection else 'none'
        }