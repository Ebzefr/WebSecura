from flask import Flask, request, jsonify, render_template, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import os
import sys
from datetime import datetime
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from functools import wraps
import json
import traceback

# Add the scanner module to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scanner'))

from .scanner.security_scanner import SecurityScanner

app = Flask(__name__, 
           static_folder='../frontend',
           template_folder='../frontend')

# Configuration
app.config['SECRET_KEY'] = secrets.token_hex(32)
app.config['DATABASE'] = 'websecura.db'

# Enable CORS with credentials support
CORS(app, 
     origins=['https://websecura-1.onrender.com', 'http://localhost:3000', 'http://127.0.0.1:8000'],
     supports_credentials=True,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# Initialize the security scanner
scanner = SecurityScanner()

# Database initialization function (move this OUTSIDE the decorator)
def init_db():
    """Initialize the database with required tables"""
    print("Creating database tables...")
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Scan history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_checks INTEGER NOT NULL,
            passed_checks INTEGER NOT NULL,
            failed_checks INTEGER NOT NULL,
            scan_data TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Contact messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database tables created successfully!")

# ensures tables are created when the app starts
try:
    init_db()
except Exception as e:
    print(f"Database initialization error: {e}")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Static Routes
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

@app.route('/login')
def login_page():
    """Serve the login page"""
    return send_from_directory('../frontend', 'login.html')

@app.route('/register') 
def register_page():
    """Serve the register page"""
    return send_from_directory('../frontend', 'register.html')

@app.route('/dashboard')
def dashboard():
    """Serve the dashboard page"""
    return send_from_directory('../frontend', 'dashboard.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory('../frontend', filename)

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.title()} is required'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM users WHERE email = ? OR username = ?', (email, username))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'User with this email or username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log the user in
        session['user_id'] = user_id
        session['username'] = username
        session['email'] = email
        
        return jsonify({
            'message': 'Account created successfully',
            'user': {
                'id': user_id,
                'username': username,
                'email': email
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Check user credentials
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, username, email, password_hash FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Log the user in
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information"""
    return jsonify({
        'user': {
            'id': session['user_id'],
            'username': session['username'],
            'email': session['email']
        }
    })

# Enhanced scan endpoint to save history for logged-in users
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
        user_id = data.get('user_id') 
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Perform security scan
        scan_results = scanner.scan_website(url)
        
        # Calculate summary
        total_checks = len(scan_results)
        passed_checks = len([r for r in scan_results if r['passed']])
        failed_checks = total_checks - passed_checks
        
        # Format response
        response = {
            'url': url,
            'scan_time': datetime.now().isoformat(),
            'results': scan_results,
            'status': 'success',
            'summary': {
                'total_checks': total_checks,
                'passed_checks': passed_checks,
                'failed_checks': failed_checks
            }
        }
        
        # Save to history if user is logged in
        if 'user_id' in session:
            try:
                conn = get_db()
                cursor = conn.cursor()
                
                scan_data_json = json.dumps(response)
                
                cursor.execute('''
                    INSERT INTO scan_history 
                    (user_id, url, total_checks, passed_checks, failed_checks, scan_data)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    url,
                    total_checks,
                    passed_checks,
                    failed_checks,
                    scan_data_json
                ))
                
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"Failed to save scan history: {e}")
                # Don't fail the scan if history saving fails
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'error': f'Scan failed: {str(e)}',
            'status': 'error'
        }), 500

# Enhanced contact endpoint to save messages
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
        
        # Save contact message to database
        conn = get_db()
        cursor = conn.cursor()
        
        user_id = session.get('user_id')  # Get user_id if logged in, None otherwise
        
        cursor.execute('''
            INSERT INTO contact_messages (name, email, subject, message, user_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['name'].strip(),
            data['email'].strip(),
            data['subject'].strip(),
            data['message'].strip(),
            user_id
        ))
        
        conn.commit()
        conn.close()
        
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

# Protected Routes
@app.route('/api/history', methods=['GET'])
def get_scan_history():
    """Get user's scan history"""
    try:
        # Check if user_id is provided as query parameter (for CORS workaround)
        user_id = request.args.get('user_id')
        
        # Fallback to session if no user_id parameter
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        if not user_id:
            print("❌ No user_id found in request or session")
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id)
        print(f"✅ Loading history for user_id: {user_id}")
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) FROM scan_history WHERE user_id = ?', (user_id,))
        total = cursor.fetchone()[0]
        print(f"📊 Found {total} total scans for user {user_id}")
        
        # Get paginated results
        offset = (page - 1) * per_page
        cursor.execute('''
            SELECT id, url, scan_time, total_checks, passed_checks, failed_checks
            FROM scan_history 
            WHERE user_id = ?
            ORDER BY scan_time DESC
            LIMIT ? OFFSET ?
        ''', (user_id, per_page, offset))
        
        scans = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        print(f"📋 Returning {len(scans)} scans for page {page}")
        
        return jsonify({
            'scans': scans,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        print(f"❌ History error: {str(e)}")
        return jsonify({'error': f'Failed to get history: {str(e)}'}), 500

@app.route('/api/history/<int:scan_id>', methods=['GET'])
def get_scan_details(scan_id):
    """Get detailed scan results"""
    try:
        # Get user_id from query parameter
        user_id = request.args.get('user_id')
        
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT scan_data FROM scan_history 
            WHERE id = ? AND user_id = ?
        ''', (scan_id, user_id))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'error': 'Scan not found'}), 404
        
        scan_data = json.loads(result['scan_data'])
        return jsonify(scan_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to get scan details: {str(e)}'}), 500

@app.route('/api/history/<int:scan_id>', methods=['DELETE'])
def delete_scan(scan_id):
    """Delete a scan from history"""
    try:
        # Get user_id from query parameter
        user_id = request.args.get('user_id')
        
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM scan_history 
            WHERE id = ? AND user_id = ?
        ''', (scan_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Scan not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Scan deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete scan: {str(e)}'}), 500

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Get user profile with statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute('SELECT username, email, created_at FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        
        # Get scan statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total_scans,
                SUM(total_checks) as total_checks,
                SUM(passed_checks) as total_passed,
                SUM(failed_checks) as total_failed,
                MIN(scan_time) as first_scan,
                MAX(scan_time) as last_scan
            FROM scan_history 
            WHERE user_id = ?
        ''', (session['user_id'],))
        
        stats = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'user': dict(user),
            'statistics': dict(stats) if stats['total_scans'] else {
                'total_scans': 0,
                'total_checks': 0,
                'total_passed': 0,
                'total_failed': 0,
                'first_scan': None,
                'last_scan': None
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Update username if provided
        if 'username' in data:
            username = data['username'].strip()
            if username:
                # Check if username is already taken
                cursor.execute('SELECT id FROM users WHERE username = ? AND id != ?', 
                             (username, session['user_id']))
                if cursor.fetchone():
                    conn.close()
                    return jsonify({'error': 'Username already taken'}), 400
                
                cursor.execute('UPDATE users SET username = ? WHERE id = ?', 
                             (username, session['user_id']))
                session['username'] = username
        
        # Update password if provided
        if 'password' in data:
            password = data['password']
            if len(password) < 6:
                conn.close()
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            
            password_hash = generate_password_hash(password)
            cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', 
                         (password_hash, session['user_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

# Health and utility endpoints
@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'WebSecura Backend',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected' if os.path.exists(app.config['DATABASE']) else 'not found'
    })

@app.route('/api/auth/check')
def check_auth():
    """Check if user is authenticated"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'email': session['email']
            }
        })
    else:
        return jsonify({'authenticated': False})

# Error handlers
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
    # Initialize database
    init_db()
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    
    # Run the app
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True
    )