import requests
import ssl
import socket
from urllib.parse import urlparse, urljoin, parse_qs
import re
from typing import List, Dict, Any
import warnings
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import time
import certifi

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
        
        # Configure SSL context with proper CA certificates
        try:
            self.ssl_context = ssl.create_default_context(cafile=certifi.where())
            self.ssl_context.check_hostname = True
            self.ssl_context.verify_mode = ssl.CERT_REQUIRED
        except Exception:
            # Fallback to default context
            self.ssl_context = ssl.create_default_context()
        
        # Known vulnerable JavaScript libraries (expanded)
        self.vulnerable_js_libraries = {
            'jquery': {
                'vulnerable_versions': ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0', '1.7.0', '1.8.0', '1.9.0', '2.0.0', '2.1.0', '2.2.0'],
                'reason': 'Multiple XSS vulnerabilities',
                'recommendation': 'Update to jQuery 3.5.0 or later'
            },
            'angular': {
                'vulnerable_versions': ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0', '1.6.0'],
                'reason': 'XSS and sandbox bypass vulnerabilities',
                'recommendation': 'Migrate to Angular 2+ or update to AngularJS 1.8.2+'
            },
            'bootstrap': {
                'vulnerable_versions': ['3.0.0', '3.1.0', '3.2.0', '3.3.0', '3.4.0'],
                'reason': 'XSS vulnerabilities in data attributes',
                'recommendation': 'Update to Bootstrap 4.0+ or Bootstrap 3.4.1+'
            }
        }
        
        # Directory traversal paths to test
        self.directory_paths = [
            '/admin',
            '/administrator',
            '/phpmyadmin',
            '/wp-admin',
            '/backup',
            '/config',
            '/debug',
            '/.env',
            '/robots.txt',
            '/.git',
            '/.svn',
            '/debug.log',
            '/error.log'
        ]
        
        # Injection patterns for passive detection
        self.injection_patterns = {
            'sql': [
                r"['\"][\s]*(?:union|select|insert|update|delete|drop|create|alter)[\s]",
                r"['\"][\s]*or[\s]+['\"]?1['\"]?[\s]*=[\s]*['\"]?1",
                r"['\"][\s]*and[\s]+['\"]?1['\"]?[\s]*=[\s]*['\"]?1",
                r"['\"][\s]*or[\s]+['\"]?.*['\"][\s]*like[\s]*['\"]"
            ],
            'xss': [
                r"<script[^>]*>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe[^>]*>",
                r"<img[^>]*onerror",
                r"<svg[^>]*onload"
            ],
            'path_traversal': [
                r"\.\./",
                r"\.\.\\",
                r"%2e%2e%2f",
                r"%2e%2e\\",
                r"..%2f",
                r"..%5c"
            ]
        }

    def scan_website(self, url: str) -> List[Dict[str, Any]]:
        """
        Perform comprehensive security scan on the given URL
        """
        results = []
        print(f"Starting comprehensive scan for: {url}")  # Debug log
        
        try:
            # Make initial request to get response and headers
            response = self.session.get(url, timeout=10, verify=False)
            headers = response.headers
            content = response.text
            print(f"Got response, content length: {len(content)}")  # Debug log
            
            # Original checks
            print("Running original checks...")  # Debug log
            results.append(self._check_https(url))
            results.extend(self._check_security_headers(headers))
            results.append(self._check_server_info(headers))
            results.append(self._check_ssl_config(url))
            results.append(self._check_xss_protection(headers, content))
            results.append(self._check_csp(headers))
            results.append(self._check_cookie_security(headers))
            results.append(self._check_clickjacking(headers))
            
            # NEW ADVANCED CHECKS
            print("Running new advanced checks...")  # Debug log
            try:
                results.append(self._check_injection_risks(content, url))
                print("✓ Injection risks check completed")
            except Exception as e:
                print(f"✗ Injection risks check failed: {e}")
                
            try:
                results.append(self._check_vulnerable_js_libraries(content))
                print("✓ JS libraries check completed")
            except Exception as e:
                print(f"✗ JS libraries check failed: {e}")
                
            try:
                results.append(self._check_directory_traversal(url))
                print("✓ Directory traversal check completed")
            except Exception as e:
                print(f"✗ Directory traversal check failed: {e}")
                
            try:
                results.append(self._check_enhanced_tls(url))
                print("✓ Enhanced TLS check completed")
            except Exception as e:
                print(f"✗ Enhanced TLS check failed: {e}")
                
            try:
                results.append(self._check_form_security(content))
                print("✓ Form security check completed")
            except Exception as e:
                print(f"✗ Form security check failed: {e}")
            
            print(f"Total checks completed: {len(results)}")  # Debug log
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")  # Debug log
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
            'severity': 'high' if not is_https else 'none',
            'recommendation': 'No action needed - HTTPS is properly configured' if is_https else 'Enable HTTPS by obtaining an SSL certificate from a trusted CA (Let\'s Encrypt, DigiCert, etc.) and configure your web server to redirect HTTP traffic to HTTPS'
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
            'severity': 'medium' if not hsts else 'none',
            'recommendation': 'HSTS properly configured' if hsts else 'Add HSTS header: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" to your web server configuration'
        })
        
        # X-Content-Type-Options
        xcto = headers.get('x-content-type-options') or headers.get('X-Content-Type-Options')
        xcto_valid = bool(xcto and 'nosniff' in xcto.lower())
        checks.append({
            'check': 'X-Content-Type-Options',
            'description': 'Prevents MIME type sniffing attacks',
            'passed': xcto_valid,
            'details': f'X-Content-Type-Options: {xcto}' if xcto else 'No X-Content-Type-Options header found',
            'severity': 'medium' if not xcto_valid else 'none',
            'recommendation': 'Header properly configured' if xcto_valid else 'Add "X-Content-Type-Options: nosniff" header to prevent browsers from MIME-sniffing responses'
        })
        
        # X-Frame-Options
        xfo = headers.get('x-frame-options') or headers.get('X-Frame-Options')
        xfo_valid = bool(xfo and xfo.upper() in ['DENY', 'SAMEORIGIN'])
        checks.append({
            'check': 'X-Frame-Options',
            'description': 'Prevents clickjacking attacks by controlling iframe embedding',
            'passed': xfo_valid,
            'details': f'X-Frame-Options: {xfo}' if xfo else 'No X-Frame-Options header found',
            'severity': 'medium' if not xfo_valid else 'none',
            'recommendation': 'Header properly configured' if xfo_valid else 'Add "X-Frame-Options: DENY" or "X-Frame-Options: SAMEORIGIN" header to prevent clickjacking attacks'
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
            'severity': 'low' if not is_secure else 'none',
            'recommendation': 'Server information properly hidden' if is_secure else 'Hide server information by removing or customizing "Server" and "X-Powered-By" headers in your web server configuration (Apache: ServerTokens Prod, Nginx: server_tokens off)'
        }

    def _check_ssl_config(self, url: str) -> Dict[str, Any]:
        """Check SSL/TLS configuration with improved certificate validation"""
        if not url.startswith('https://'):
            return {
                'check': 'SSL/TLS Configuration',
                'description': 'Validates SSL certificate and TLS configuration',
                'passed': False,
                'details': 'Website does not use HTTPS',
                'severity': 'high',
                'recommendation': 'Enable HTTPS by obtaining an SSL certificate and configuring your web server'
            }
        
        try:
            parsed_url = urlparse(url)
            hostname = parsed_url.hostname
            port = parsed_url.port or 443
            
            # Use improved SSL context with proper CA certificates
            with socket.create_connection((hostname, port), timeout=10) as sock:
                try:
                    # Try with certificate verification first
                    with self.ssl_context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        protocol = ssock.version()
                        cipher = ssock.cipher()
                        
                        # Check certificate validity
                        cert_issues = []
                        if cert:
                            # Check if certificate is valid for the hostname
                            subject = dict(x[0] for x in cert.get('subject', []))
                            if 'commonName' in subject and hostname not in subject['commonName']:
                                # Check subject alternative names
                                san_list = []
                                for ext in cert.get('subjectAltName', []):
                                    if ext[0] == 'DNS':
                                        san_list.append(ext[1])
                                if hostname not in san_list:
                                    cert_issues.append(f"Certificate not valid for hostname {hostname}")
                        
                        return {
                            'check': 'SSL/TLS Configuration',
                            'description': 'Validates SSL certificate and TLS configuration',
                            'passed': len(cert_issues) == 0,
                            'details': f'Valid SSL certificate ✓ | TLS Version: {protocol}' if len(cert_issues) == 0 else f'Certificate issues: {"; ".join(cert_issues)} | TLS Version: {protocol}',
                            'severity': 'high' if len(cert_issues) > 0 else 'none',
                            'recommendation': 'SSL/TLS configuration is properly set up' if len(cert_issues) == 0 else 'Ensure SSL certificate is valid for your domain and properly configured'
                        }
                        
                except ssl.SSLError:
                    # Fallback to no verification for analysis
                    context_no_verify = ssl.create_default_context()
                    context_no_verify.check_hostname = False
                    context_no_verify.verify_mode = ssl.CERT_NONE
                    
                    with context_no_verify.wrap_socket(sock, server_hostname=hostname) as ssock:
                        protocol = ssock.version()
                        
                        return {
                            'check': 'SSL/TLS Configuration',
                            'description': 'Validates SSL certificate and TLS configuration',
                            'passed': False,
                            'details': f'SSL certificate validation failed, but connection established | TLS Version: {protocol}',
                            'severity': 'high',
                            'recommendation': 'Check SSL certificate validity, ensure it\'s issued by a trusted CA and valid for your domain'
                        }
            
        except Exception as e:
            return {
                'check': 'SSL/TLS Configuration',
                'description': 'Validates SSL certificate and TLS configuration',
                'passed': False,
                'details': f'SSL/TLS connection failed: {str(e)}',
                'severity': 'high',
                'recommendation': 'Verify SSL certificate installation and TLS configuration on your web server'
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
        
        passed = has_protection and not potential_xss
        
        return {
            'check': 'XSS Protection',
            'description': 'Checks for Cross-Site Scripting protection mechanisms',
            'passed': passed,
            'details': " | ".join(details),
            'severity': 'high' if potential_xss else 'medium' if not has_protection else 'none',
            'recommendation': 'XSS protection properly configured' if passed else 'Add "X-XSS-Protection: 1; mode=block" header and implement Content Security Policy (CSP) for better XSS protection. Validate and sanitize all user inputs.'
        }

    def _check_csp(self, headers: Dict[str, str]) -> Dict[str, Any]:
        """Check Content Security Policy"""
        csp = headers.get('content-security-policy') or headers.get('Content-Security-Policy')
        
        return {
            'check': 'Content Security Policy (CSP)',
            'description': 'Prevents XSS attacks by controlling resource loading',
            'passed': bool(csp),
            'details': f'CSP Header found ✓' if csp else 'No Content Security Policy header found',
            'severity': 'medium' if not csp else 'none',
            'recommendation': 'CSP properly configured' if csp else 'Implement Content Security Policy header to prevent XSS attacks: "Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'"'
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
                'severity': 'none',
                'recommendation': 'No cookies detected - no action needed'
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
            'severity': 'medium' if not is_secure else 'none',
            'recommendation': 'Cookie security properly configured' if is_secure else f'Add missing cookie security attributes: {", ".join(missing_flags)}. Use "Secure" for HTTPS-only cookies, "HttpOnly" to prevent XSS access, and "SameSite" to prevent CSRF attacks.'
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
            'severity': 'medium' if not has_protection else 'none',
            'recommendation': 'Clickjacking protection properly configured' if has_protection else 'Add "X-Frame-Options: DENY" header or CSP "frame-ancestors \'none\'" directive to prevent clickjacking attacks'
        }

    # NEW ADVANCED SECURITY CHECKS

    def _check_injection_risks(self, content: str, url: str) -> Dict[str, Any]:
        """Enhanced injection risk detection with passive pattern analysis"""
        injection_risks = []
        
        # Check for forms without CSRF protection
        form_pattern = r'<form[^>]*>(.*?)</form>'
        forms = re.findall(form_pattern, content, re.DOTALL | re.IGNORECASE)
        
        csrf_tokens = ['csrf', '_token', 'authenticity_token', '__RequestVerificationToken']
        
        csrf_missing = 0
        for form in forms:
            has_csrf = any(token in form.lower() for token in csrf_tokens)
            if not has_csrf:
                csrf_missing += 1
        
        if csrf_missing > 0:
            injection_risks.append(f"{csrf_missing} form(s) without CSRF protection")
        
        # Enhanced URL parameter analysis
        parsed_url = urlparse(url)
        if parsed_url.query:
            query_params = parse_qs(parsed_url.query)
            suspicious_params = []
            
            for param, values in query_params.items():
                param_lower = param.lower()
                # Check for suspicious parameter names
                if any(suspicious in param_lower for suspicious in ['id', 'user', 'file', 'page', 'url', 'redirect', 'path', 'cmd', 'exec']):
                    suspicious_params.append(param)
                
                # Check parameter values for injection patterns
                for value in values:
                    for injection_type, patterns in self.injection_patterns.items():
                        for pattern in patterns:
                            if re.search(pattern, value, re.IGNORECASE):
                                injection_risks.append(f"Potential {injection_type} pattern in parameter '{param}'")
                                break
            
            if suspicious_params:
                injection_risks.append(f"Suspicious parameters detected: {', '.join(suspicious_params)}")
        
        # Analyze form inputs for injection patterns
        input_pattern = r'<input[^>]*name=["\']([^"\']*)["\'][^>]*value=["\']([^"\']*)["\'][^>]*>'
        inputs = re.findall(input_pattern, content, re.IGNORECASE)
        
        for input_name, input_value in inputs:
            for injection_type, patterns in self.injection_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, input_value, re.IGNORECASE):
                        injection_risks.append(f"Potential {injection_type} pattern in input '{input_name}'")
                        break
        
        # Check for SQL injection patterns in error messages
        sql_error_patterns = [
            r'mysql_fetch_array',
            r'ORA-\d+',
            r'Microsoft.*ODBC.*SQL Server',
            r'PostgreSQL.*ERROR',
            r'sqlite3\.OperationalError',
            r'Warning.*mysql_.*',
            r'valid MySQL result',
            r'MySqlClient\.'
        ]
        
        for pattern in sql_error_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                injection_risks.append("SQL error exposure detected in page content")
                break
        
        is_secure = len(injection_risks) == 0
        
        return {
            'check': 'Injection Risk Assessment (OWASP A03)',
            'description': 'Detects forms without CSRF protection, suspicious parameters, and injection patterns',
            'passed': is_secure,
            'details': 'No injection risks detected ✓' if is_secure else f'Injection risks found: {", ".join(injection_risks)}',
            'severity': 'high' if not is_secure else 'none',
            'recommendation': 'No injection risks detected' if is_secure else 'Implement CSRF tokens in all forms, validate and sanitize all user inputs, use parameterized queries, and avoid exposing database errors to users'
        }

    def _check_vulnerable_js_libraries(self, content: str) -> Dict[str, Any]:
        """Check for outdated JavaScript libraries with known vulnerabilities"""
        vulnerable_libs = []
        recommendations = []
        
        # Common CDN patterns for JavaScript libraries
        js_patterns = {
            'jquery': r'jquery[/-](\d+\.\d+\.\d+)',
            'angular': r'angular[/-](\d+\.\d+\.\d+)',
            'bootstrap': r'bootstrap[/-](\d+\.\d+\.\d+)'
        }
        
        for lib_name, pattern in js_patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            for version in matches:
                if lib_name in self.vulnerable_js_libraries:
                    vuln_versions = self.vulnerable_js_libraries[lib_name]['vulnerable_versions']
                    if version in vuln_versions:
                        reason = self.vulnerable_js_libraries[lib_name]['reason']
                        recommendation = self.vulnerable_js_libraries[lib_name]['recommendation']
                        vulnerable_libs.append(f"{lib_name} v{version} - {reason}")
                        recommendations.append(f"{lib_name}: {recommendation}")
        
        is_secure = len(vulnerable_libs) == 0
        
        return {
            'check': 'Vulnerable JavaScript Libraries',
            'description': 'Scans for outdated JavaScript libraries with known security vulnerabilities',
            'passed': is_secure,
            'details': 'No vulnerable JavaScript libraries detected ✓' if is_secure else f'Vulnerable libraries found: {"; ".join(vulnerable_libs)}',
            'severity': 'medium' if not is_secure else 'none',
            'recommendation': 'All JavaScript libraries are up to date' if is_secure else f'Update vulnerable libraries: {"; ".join(recommendations)}'
        }

    def _check_directory_traversal(self, url: str) -> Dict[str, Any]:
        """Check for directory listing and path traversal vulnerabilities"""
        accessible_paths = []
        
        base_url = url.rstrip('/')
        
        for path in self.directory_paths[:10]:  # Limit to first 10 to avoid too many requests
            try:
                test_url = base_url + path
                response = self.session.get(test_url, timeout=5, verify=False, allow_redirects=False)
                
                # Check for successful responses or directory listings
                if response.status_code == 200:
                    content_lower = response.text.lower()
                    
                    # Signs of directory listing
                    if any(indicator in content_lower for indicator in ['index of', 'directory listing', 'parent directory']):
                        accessible_paths.append(f"{path} - Directory listing exposed")
                    # Signs of sensitive files
                    elif path == '/.env' and any(env_var in content_lower for env_var in ['db_password', 'api_key', 'secret']):
                        accessible_paths.append(f"{path} - Environment file exposed")
                    elif path in ['/admin', '/administrator', '/phpmyadmin'] and 'login' in content_lower:
                        accessible_paths.append(f"{path} - Admin interface accessible")
                        
            except (requests.RequestException, Exception):
                # Ignore connection errors for this test
                continue
        
        is_secure = len(accessible_paths) == 0
        
        return {
            'check': 'Directory Traversal & Sensitive File Exposure',
            'description': 'Tests for accessible admin panels, system files, and directory listings',
            'passed': is_secure,
            'details': 'No sensitive directories or files exposed ✓' if is_secure else f'Accessible paths found: {"; ".join(accessible_paths)}',
            'severity': 'high' if not is_secure else 'none',
            'recommendation': 'Directory access properly restricted' if is_secure else 'Restrict access to sensitive directories and files using .htaccess (Apache) or server block rules (Nginx). Remove or protect admin interfaces, config files, and directory listings.'
        }

    def _check_enhanced_tls(self, url: str) -> Dict[str, Any]:
        """Enhanced TLS/SSL analysis including version and cipher checks"""
        if not url.startswith('https://'):
            return {
                'check': 'Enhanced TLS Analysis',
                'description': 'Analyzes TLS version, cipher suites, and certificate security',
                'passed': False,
                'details': 'Website does not use HTTPS',
                'severity': 'high',
                'recommendation': 'Enable HTTPS by obtaining an SSL certificate and configuring your web server'
            }
        
        try:
            parsed_url = urlparse(url)
            hostname = parsed_url.hostname
            port = parsed_url.port or 443
            
            # Test different TLS versions
            tls_issues = []
            
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    protocol = ssock.version()
                    cipher = ssock.cipher()
                    
                    # Check TLS version
                    if protocol in ['TLSv1', 'TLSv1.1', 'SSLv2', 'SSLv3']:
                        tls_issues.append(f"Weak TLS version: {protocol}")
                    
                    # Check cipher strength
                    if cipher and len(cipher) >= 3:
                        cipher_name = cipher[0]
                        key_length = cipher[2]
                        
                        if key_length < 128:
                            tls_issues.append(f"Weak cipher key length: {key_length} bits")
                        
                        if any(weak in cipher_name.upper() for weak in ['RC4', 'DES', 'MD5']):
                            tls_issues.append(f"Weak cipher: {cipher_name}")
            
            is_secure = len(tls_issues) == 0
            
            return {
                'check': 'Enhanced TLS Analysis',
                'description': 'Analyzes TLS version, cipher suites, and certificate security',
                'passed': is_secure,
                'details': f'Strong TLS configuration ✓ (Protocol: {protocol})' if is_secure else f'TLS issues found: {"; ".join(tls_issues)}',
                'severity': 'medium' if not is_secure else 'none',
                'recommendation': 'TLS configuration is secure and up to date' if is_secure else 'Update TLS configuration to use TLS 1.2+ only, disable weak ciphers (RC4, DES, MD5), and ensure minimum 128-bit key length. Configure strong cipher suites in your web server.'
            }
            
        except Exception as e:
            return {
                'check': 'Enhanced TLS Analysis',
                'description': 'Analyzes TLS version, cipher suites, and certificate security',
                'passed': False,
                'details': f'TLS analysis failed: {str(e)}',
                'severity': 'medium',
                'recommendation': 'Verify TLS configuration and ensure the server supports modern TLS protocols and cipher suites'
            }

    def _check_form_security(self, content: str) -> Dict[str, Any]:
        """Check form security attributes and validation"""
        form_issues = []
        
        # Find all forms
        form_pattern = r'<form[^>]*>(.*?)</form>'
        forms = re.findall(form_pattern, content, re.DOTALL | re.IGNORECASE)
        
        for i, form in enumerate(forms, 1):
            # Check for password fields without autocomplete=off
            password_fields = re.findall(r'<input[^>]*type=["\']password["\'][^>]*>', form, re.IGNORECASE)
            for field in password_fields:
                if 'autocomplete="off"' not in field and 'autocomplete=\'off\'' not in field:
                    form_issues.append(f"Form {i}: Password field without autocomplete=off")
            
            # Check for forms without method specified (defaults to GET)
            form_tag = re.search(r'<form[^>]*>', form, re.IGNORECASE)
            if form_tag and 'method=' not in form_tag.group(0).lower():
                form_issues.append(f"Form {i}: No HTTP method specified (defaults to GET)")
            
            # Check for forms using GET method with sensitive fields
            if form_tag and 'method="get"' in form_tag.group(0).lower():
                sensitive_inputs = re.findall(r'<input[^>]*type=["\'](?:password|email|tel)["\']', form, re.IGNORECASE)
                if sensitive_inputs:
                    form_issues.append(f"Form {i}: Sensitive data sent via GET method")
        
        is_secure = len(form_issues) == 0
        
        return {
            'check': 'Form Security Configuration',
            'description': 'Analyzes form security attributes, methods, and sensitive data handling',
            'passed': is_secure,
            'details': 'All forms properly configured ✓' if is_secure else f'Form security issues: {"; ".join(form_issues)}',
            'severity': 'medium' if not is_secure else 'none',
            'recommendation': 'Form security properly configured' if is_secure else 'Use POST method for sensitive data, add autocomplete="off" to password fields, and always specify form methods explicitly. Implement proper input validation and CSRF protection.'
        }