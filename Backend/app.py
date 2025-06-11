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
        if user_id:
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
def get_profile():
    """Get user profile with statistics"""
    try:
        # Get user_id from query parameter (for CORS workaround)
        user_id = request.args.get('user_id')
        
        # Fallback to session if no user_id parameter
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        if not user_id:
            print("❌ No user_id found in profile request")
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id)
        print(f"✅ Loading profile for user_id: {user_id}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute('SELECT username, email, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
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
        ''', (user_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        print(f"📊 Profile stats for user {user_id}: {dict(stats) if stats['total_scans'] else 'No scans'}")
        
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
        print(f"❌ Profile error: {str(e)}")
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        
        # Get user_id from request body (same pattern as scan endpoint)
        user_id = data.get('user_id')
        
        # Fallback to session if no user_id in request body
        if not user_id and 'user_id' in session:
            user_id = session['user_id']
        
        if not user_id:
            print("❌ No user_id found in profile update request")
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = int(user_id)
        print(f"✅ Updating profile for user_id: {user_id}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify user exists
        cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Update username if provided
        if 'username' in data:
            username = data['username'].strip()
            if username:
                # Check if username is already taken
                cursor.execute('SELECT id FROM users WHERE username = ? AND id != ?', 
                             (username, user_id))
                if cursor.fetchone():
                    conn.close()
                    return jsonify({'error': 'Username already taken'}), 400
                
                cursor.execute('UPDATE users SET username = ? WHERE id = ?', 
                             (username, user_id))
                print(f"✅ Username updated for user {user_id}")
        
        # Update password if provided
        if 'password' in data:
            password = data['password']
            if len(password) < 6:
                conn.close()
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            
            password_hash = generate_password_hash(password)
            cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', 
                         (password_hash, user_id))
            print(f"✅ Password updated for user {user_id}")
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'})
        
    except Exception as e:
        print(f"❌ Profile update error: {str(e)}")
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

    # Complete Admin Backend Endpoints - Add these to your Flask app

def check_admin_auth(admin_id):
    """Helper function to check if user is admin"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT is_admin FROM users WHERE id = ?', (admin_id,))
        result = cursor.fetchone()
        conn.close()
        return result and result['is_admin']
    except:
        return False

def add_admin_column():
    """Add is_admin column to users table if it doesn't exist"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
        conn.commit()
        conn.close()
        print("✅ Added is_admin column to users table")
    except Exception as e:
        print(f"ℹ️ is_admin column might already exist: {e}")

# Initialize admin column when app starts
add_admin_column()

# Admin Statistics
@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get dashboard statistics for admin"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Total users
        cursor.execute('SELECT COUNT(*) as total_users FROM users')
        total_users = cursor.fetchone()['total_users']
        
        # Total scans
        cursor.execute('SELECT COUNT(*) as total_scans FROM scan_history')
        total_scans = cursor.fetchone()['total_scans']
        
        # Total messages
        cursor.execute('SELECT COUNT(*) as total_messages FROM contact_messages')
        total_messages = cursor.fetchone()['total_messages']
        
        # Average security score
        cursor.execute('''
            SELECT AVG(CAST(passed_checks AS FLOAT) / CAST(total_checks AS FLOAT) * 100) as avg_score
            FROM scan_history 
            WHERE total_checks > 0
        ''')
        avg_result = cursor.fetchone()
        avg_security_score = avg_result['avg_score'] if avg_result['avg_score'] else 0
        
        conn.close()
        
        return jsonify({
            'total_users': total_users,
            'total_scans': total_scans,
            'total_messages': total_messages,
            'avg_security_score': avg_security_score
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500

# Admin Users Management
@app.route('/api/admin/users', methods=['GET'])
def get_admin_users():
    """Get all users for admin dashboard"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                u.id, u.username, u.email, u.created_at, u.is_admin,
                COUNT(sh.id) as scan_count
            FROM users u
            LEFT JOIN scan_history sh ON u.id = sh.user_id
            GROUP BY u.id, u.username, u.email, u.created_at, u.is_admin
            ORDER BY u.created_at DESC
        ''')
        
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'users': users})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
def get_admin_user_details(user_id):
    """Get detailed user information"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute('''
            SELECT id, username, email, created_at, is_admin
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        user_data = dict(user)
        
        # Get user's scan count
        cursor.execute('SELECT COUNT(*) as scan_count FROM scan_history WHERE user_id = ?', (user_id,))
        scan_count = cursor.fetchone()['scan_count']
        user_data['scan_count'] = scan_count
        
        # Get recent scans
        cursor.execute('''
            SELECT url, scan_time, total_checks, passed_checks
            FROM scan_history 
            WHERE user_id = ?
            ORDER BY scan_time DESC
            LIMIT 5
        ''', (user_id,))
        
        recent_scans = [dict(row) for row in cursor.fetchall()]
        user_data['recent_scans'] = recent_scans
        
        conn.close()
        
        return jsonify(user_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user details: {str(e)}'}), 500

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
def toggle_user_status(user_id):
    """Toggle user active/inactive status"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Don't allow deactivating admin users
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if user and user['is_admin']:
            conn.close()
            return jsonify({'error': 'Cannot deactivate admin users'}), 400
        
        is_active = data.get('is_active', True)
        
        # Add is_active column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE')
            conn.commit()
        except:
            pass  # Column might already exist
        
        cursor.execute('UPDATE users SET is_active = ? WHERE id = ?', (is_active, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': f'User {"activated" if is_active else "deactivated"} successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to update user status: {str(e)}'}), 500

# Admin Scans Management
@app.route('/api/admin/scans', methods=['GET'])
def get_admin_scans():
    """Get recent scans for admin dashboard"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        limit = request.args.get('limit', 50, type=int)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                sh.id, sh.url, sh.scan_time, sh.total_checks, 
                sh.passed_checks, sh.failed_checks,
                u.username
            FROM scan_history sh
            LEFT JOIN users u ON sh.user_id = u.id
            ORDER BY sh.scan_time DESC
            LIMIT ?
        ''', (limit,))
        
        scans = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'scans': scans})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get scans: {str(e)}'}), 500

@app.route('/api/admin/scans/<int:scan_id>', methods=['DELETE'])
def delete_admin_scan(scan_id):
    """Delete a scan (admin only)"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM scan_history WHERE id = ?', (scan_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Scan not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Scan deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete scan: {str(e)}'}), 500

# Admin Messages Management
@app.route('/api/admin/messages', methods=['GET'])
def get_admin_messages():
    """Get contact messages for admin dashboard"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Add is_read column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE contact_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE')
            conn.commit()
        except:
            pass  # Column might already exist
        
        cursor.execute('''
            SELECT id, name, email, subject, message, created_at, is_read, user_id
            FROM contact_messages 
            ORDER BY created_at DESC
        ''')
        
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'messages': messages})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get messages: {str(e)}'}), 500

@app.route('/api/admin/messages/<int:message_id>', methods=['GET'])
def get_admin_message_details(message_id):
    """Get detailed message information"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT cm.*, u.username
            FROM contact_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            WHERE cm.id = ?
        ''', (message_id,))
        
        message = cursor.fetchone()
        conn.close()
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        return jsonify(dict(message))
        
    except Exception as e:
        return jsonify({'error': f'Failed to get message details: {str(e)}'}), 500

@app.route('/api/admin/messages/<int:message_id>/read', methods=['PUT'])
def mark_message_read(message_id):
    """Mark a message as read"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE contact_messages SET is_read = TRUE WHERE id = ?', (message_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Message not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Message marked as read'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark message as read: {str(e)}'}), 500

@app.route('/api/admin/messages/read-all', methods=['PUT'])
def mark_all_messages_read():
    """Mark all messages as read"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE contact_messages SET is_read = TRUE WHERE is_read = FALSE')
        updated_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': f'{updated_count} messages marked as read'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to mark messages as read: {str(e)}'}), 500

@app.route('/api/admin/messages/<int:message_id>', methods=['DELETE'])
def delete_admin_message(message_id):
    """Delete a contact message"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM contact_messages WHERE id = ?', (message_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Message not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Message deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete message: {str(e)}'}), 500

# Admin System Information
@app.route('/api/admin/system', methods=['GET'])
def get_admin_system_info():
    """Get system information for admin dashboard"""
    try:
        admin_id = request.args.get('admin_id')
        if not admin_id or not check_admin_auth(admin_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Database status
        database_status = 'connected'
        try:
            cursor.execute('SELECT COUNT(*) FROM sqlite_master WHERE type="table"')
            table_count = cursor.fetchone()[0]
        except:
            database_status = 'error'
            table_count = 0
        
        # Recent activity
        try:
            cursor.execute('''
                SELECT 'User Registration' as action, created_at as timestamp
                FROM users 
                WHERE created_at >= datetime('now', '-7 days')
                UNION ALL
                SELECT 'Security Scan' as action, scan_time as timestamp
                FROM scan_history 
                WHERE scan_time >= datetime('now', '-7 days')
                UNION ALL
                SELECT 'Contact Message' as action, created_at as timestamp
                FROM contact_messages 
                WHERE created_at >= datetime('now', '-7 days')
                ORDER BY timestamp DESC
                LIMIT 10
            ''')
            recent_activity = [dict(row) for row in cursor.fetchall()]
        except:
            recent_activity = []
        
        conn.close()
        
        return jsonify({
            'database_status': database_status,
            'table_count': table_count,
            'last_backup': 'Never',  # You can implement backup tracking
            'uptime': 'Unknown',     # You can implement uptime tracking
            'version': '1.0.0',
            'recent_activity': recent_activity
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system info: {str(e)}'}), 500

# Create first admin user (run this once)
@app.route('/api/admin/create-admin', methods=['POST'])
def create_admin_user():
    """Create the first admin user - for initial setup only"""
    try:
        data = request.get_json()
        
        # Only allow if no admin users exist
        conn = get_db()
        cursor = conn.cursor()
        
        # Add is_admin column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
            conn.commit()
        except:
            pass  # Column might already exist
        
        cursor.execute('SELECT COUNT(*) as admin_count FROM users WHERE is_admin = TRUE')
        admin_count = cursor.fetchone()['admin_count']
        
        if admin_count > 0:
            conn.close()
            return jsonify({'error': 'Admin user already exists'}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            conn.close()
            return jsonify({'error': 'Username, email, and password required'}), 400
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = ? OR username = ?', (email, username))
        if cursor.fetchone():
            # Update existing user to admin
            cursor.execute('UPDATE users SET is_admin = TRUE WHERE email = ? OR username = ?', (email, username))
        else:
            # Create new admin user
            password_hash = generate_password_hash(password)
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, is_admin)
                VALUES (?, ?, ?, TRUE)
            ''', (username, email, password_hash))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Admin user created successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to create admin user: {str(e)}'}), 500

# Update your existing login endpoint to include is_admin in response
@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint with admin support"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Add is_admin column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
            conn.commit()
        except:
            pass  # Column might already exist
        
        cursor.execute('''
            SELECT id, username, email, password_hash, is_admin 
            FROM users WHERE email = ?
        ''', (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Log the user in
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']
        session['is_admin'] = user['is_admin']
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'is_admin': user['is_admin']  # Include admin status
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

# Update your existing register endpoint to support creating admin users
@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint with optional admin support"""
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.title()} is required'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        is_admin = data.get('is_admin', False)  # Optional admin flag
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Add is_admin column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
            conn.commit()
        except:
            pass  # Column might already exist
        
        cursor.execute('SELECT id FROM users WHERE email = ? OR username = ?', (email, username))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'User with this email or username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        cursor.execute(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
            (username, email, password_hash, is_admin)
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Log the user in
        session['user_id'] = user_id
        session['username'] = username
        session['email'] = email
        session['is_admin'] = is_admin
        
        return jsonify({
            'message': 'Account created successfully',
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'is_admin': is_admin
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500 