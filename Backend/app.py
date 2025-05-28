from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys
from datetime import datetime

# Add the scanner module to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scanner'))

from scanner.security_scanner import SecurityScanner

app = Flask(__name__, 
           static_folder='../frontend',  # Point to your frontend directory
           template_folder='../frontend') # Point to your frontend directory

# Enable CORS for all routes
CORS(app, origins=['*'])

# Initialize the security scanner
scanner = SecurityScanner()

@app.route('/')
def index():
    """Serve the main frontend page"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/about')
def about():
    """Serve the about page"""
    return send_from_directory('../frontend', 'about.html')

@app.route('/contact')
def contact():
    """Serve the contact page"""
    return send_from_directory('../frontend', 'contact.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory('../frontend', filename)

@app.route('/api/scan', methods=['POST'])
def scan_website():
    """API endpoint to scan a website for security vulnerabilities"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'error': 'URL is required',
                'status': 'error'
            }), 400
        
        url = data['url'].strip()
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Perform security scan
        scan_results = scanner.scan_website(url)
        
        # Format response
        response = {
            'url': url,
            'scan_time': datetime.now().isoformat(),
            'results': scan_results,
            'status': 'success'
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': f'Scan failed: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/contact', methods=['POST'])
def handle_contact():
    """API endpoint to handle contact form submissions"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'error': f'{field.title()} is required',
                    'status': 'error'
                }), 400
        
        # Here you would typically:
        # 1. Save to database
        # 2. Send email notification
        # 3. Log the contact request
        
        # For now, just return success
        response = {
            'message': 'Contact form submitted successfully',
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to process contact form: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'WebSecura Backend',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'error'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'status': 'error'
    }), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )