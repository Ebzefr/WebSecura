# Backend/app.py - POLISHED VERSION
# Enhanced with better error handling, validation, and logging

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime, timedelta
import sqlite3
import json
import traceback
import re
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

# Add the scanner module to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scanner'))

from scanner.security_scanner import SecurityScanner
from scanner.performance_analyzer import PerformanceAnalyzer

# Import scheduler
try:
    from scheduler import start_scheduler_thread
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False

app = Flask(__name__)

# Configuration
app.config['DATABASE'] = 'websecura.db'
app.config['MAX_URL_LENGTH'] = 2048
app.config['VALID_FREQUENCIES'] = ['hourly', 'daily', 'weekly', 'monthly']

# Enable CORS
CORS(app, 
     origins=[
         'http://localhost:3000',
         'http://localhost:3002',
         'https://web-secura.vercel.app',
         re.compile(r'https://.*\.vercel\.app')
     ],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])
# Initialize scanners
scanner = SecurityScanner()
performance_analyzer = PerformanceAnalyzer()

# ===== UTILITY FUNCTIONS =====

def validate_url(url):
    """Validate URL format"""
    if not url or not isinstance(url, str):
        return False, "URL is required and must be a string"
    
    url = url.strip()
    
    if len(url) > app.config['MAX_URL_LENGTH']:
        return False, f"URL too long (max {app.config['MAX_URL_LENGTH']} characters)"
    
    # Basic URL pattern validation
    url_pattern = re.compile(
        r'^(https?://)?' # optional protocol
        r'([\da-z\.-]+)' # domain
        r'\.([a-z\.]{2,6})' # TLD
        r'([/\w\.-]*)*' # path
        r'/?$', # optional trailing slash
        re.IGNORECASE
    )
    
    if not url_pattern.match(url):
        return False, "Invalid URL format. Please provide a valid URL (e.g., example.com or https://example.com)"
    
    return True, url

def sanitize_url(url):
    """Sanitize and normalize URL"""
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url

def error_response(message, status_code=400, error_type="validation_error"):
    """Standardized error response"""
    return jsonify({
        'status': 'error',
        'error': message,
        'error_type': error_type
    }), status_code

def success_response(data=None, message=None):
    """Standardized success response"""
    response = {'status': 'success'}
    if message:
        response['message'] = message
    if data:
        response.update(data)
    return jsonify(response)

# ===== DATABASE FUNCTIONS =====

def init_db():
    """Initialize the database with required tables"""
    print("Creating database tables...")
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # Scan history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            url TEXT NOT NULL,
            scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            security_score INTEGER,
            performance_score INTEGER,
            overall_score INTEGER,
            total_checks INTEGER NOT NULL,
            passed_checks INTEGER NOT NULL,
            failed_checks INTEGER NOT NULL,
            scan_data TEXT NOT NULL
        )
    ''')
    
    # Scheduled scans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scheduled_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            url TEXT NOT NULL,
            frequency TEXT NOT NULL,
            last_run TIMESTAMP,
            next_run TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            alert_threshold INTEGER DEFAULT 10,
            last_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Alert history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scheduled_scan_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            url TEXT NOT NULL,
            message TEXT NOT NULL,
            old_score INTEGER,
            new_score INTEGER,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scheduled_scan_id) REFERENCES scheduled_scans (id)
        )
    ''')
    
    # Email preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            email_enabled BOOLEAN DEFAULT TRUE,
            smtp_configured BOOLEAN DEFAULT FALSE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database tables created successfully!")

try:
    init_db()
except Exception as e:
    print(f"❌ Database initialization error: {e}")
    sys.exit(1)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def calculate_next_run(frequency):
    """Calculate next run time based on frequency"""
    now = datetime.now()
    frequency_map = {
        'hourly': timedelta(hours=1),
        'daily': timedelta(days=1),
        'weekly': timedelta(weeks=1),
        'monthly': timedelta(days=30)
    }
    return now + frequency_map.get(frequency, timedelta(days=1))

# ===== SCAN ENDPOINTS =====

@app.route('/api/scan', methods=['POST'])
def scan_website():
    """Scan a website - NO AUTH REQUIRED"""
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)
        
        url = data.get('url', '').strip()
        user_id = data.get('user_id')
        
        # Validate URL
        is_valid, result = validate_url(url)
        if not is_valid:
            return error_response(result, 400)
        
        url = sanitize_url(result if is_valid else url)
        
        print(f"\n{'='*50}")
        print(f"📊 SCAN REQUEST")
        print(f"URL: {url}")
        print(f"User ID: {user_id or 'Anonymous'}")
        print(f"{'='*50}\n")
        
        # Run security scan
        print(f"🔍 Starting security scan for: {url}")
        try:
            security_results = scanner.scan_website(url)
        except Exception as e:
            print(f"❌ Security scan failed: {e}")
            return error_response(
                "Failed to scan website. The site may be unreachable or blocking our scanner.",
                500,
                "scan_error"
            )
        
        # Run performance analysis
        print(f"⚡ Starting performance analysis for: {url}")
        try:
            performance_results = performance_analyzer.analyze_website(url)
        except Exception as e:
            print(f"⚠️ Performance analysis failed: {e}")
            performance_results = {'overall_score': 0, 'metrics': {}}
        
        # Calculate scores
        total_checks = len(security_results)
        passed_checks = len([r for r in security_results if r.get('passed')])
        failed_checks = total_checks - passed_checks
        security_score = int((passed_checks / total_checks) * 100) if total_checks > 0 else 0
        performance_score = performance_results.get('overall_score', 0)
        overall_score = int((security_score + performance_score) / 2)
        
        print(f"\n✅ Scan Complete:")
        print(f"   Security Score: {security_score}")
        print(f"   Performance Score: {performance_score}")
        print(f"   Overall Score: {overall_score}")
        
        # Build response
        response = {
            'url': url,
            'scan_time': datetime.now().isoformat(),
            'security': {
                'results': security_results,
                'score': security_score,
                'summary': {
                    'total_checks': total_checks,
                    'passed_checks': passed_checks,
                    'failed_checks': failed_checks
                }
            },
            'performance': performance_results,
            'overall_score': overall_score
        }
        
        # Save to database if user is authenticated
        if user_id and user_id not in ['null', '', None]:
            try:
                print(f"💾 Saving scan to database...")
                conn = get_db()
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO scan_history 
                    (user_id, url, security_score, performance_score, overall_score, 
                     total_checks, passed_checks, failed_checks, scan_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_id, url, security_score, performance_score, overall_score,
                    total_checks, passed_checks, failed_checks, json.dumps(response)
                ))
                
                scan_id = cursor.lastrowid
                conn.commit()
                conn.close()
                print(f"✅ Scan saved! ID: {scan_id}")
            except Exception as e:
                print(f"⚠️ Failed to save scan: {e}")
        else:
            print(f"ℹ️  Anonymous scan (no save)")
        
        return success_response(response)
        
    except Exception as e:
        print(f"❌ Scan error: {traceback.format_exc()}")
        return error_response(
            "An unexpected error occurred during the scan. Please try again.",
            500,
            "internal_error"
        )

@app.route('/api/scan-history/<user_id>', methods=['GET'])
def get_scan_history(user_id):
    """Get all scan history for a user"""
    try:
        # Validate user_id
        if not user_id or user_id == 'null':
            return error_response("Valid user ID is required", 400)
        
        print(f"📜 Fetching scan history for user: {user_id}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, url, scan_time, security_score, performance_score, 
                   overall_score, total_checks, passed_checks, failed_checks, scan_data
            FROM scan_history 
            WHERE user_id = ?
            ORDER BY scan_time DESC
            LIMIT 100
        ''', (user_id,))
        
        scans = []
        for row in cursor.fetchall():
            scans.append({
                'id': row['id'],
                'url': row['url'],
                'scan_time': row['scan_time'],
                'security_score': row['security_score'],
                'performance_score': row['performance_score'],
                'overall_score': row['overall_score'],
                'total_checks': row['total_checks'],
                'passed_checks': row['passed_checks'],
                'failed_checks': row['failed_checks'],
                'scan_data': row['scan_data']
            })
        
        conn.close()
        print(f"✅ Found {len(scans)} scans")
        
        return success_response({'scans': scans})
        
    except Exception as e:
        print(f"❌ Error fetching scan history: {e}")
        return error_response(
            "Failed to fetch scan history. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/scan-history/<int:scan_id>', methods=['DELETE'])
def delete_scan(scan_id):
    """Delete a scan from history"""
    try:
        # Validate scan_id
        if scan_id <= 0:
            return error_response("Invalid scan ID", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if scan exists
        cursor.execute('SELECT id FROM scan_history WHERE id = ?', (scan_id,))
        if not cursor.fetchone():
            conn.close()
            return error_response("Scan not found", 404, "not_found")
        
        # Delete scan
        cursor.execute('DELETE FROM scan_history WHERE id = ?', (scan_id,))
        conn.commit()
        conn.close()
        
        return success_response(message='Scan deleted successfully')
        
    except Exception as e:
        print(f"❌ Error deleting scan: {e}")
        return error_response(
            "Failed to delete scan. Please try again.",
            500,
            "database_error"
        )

# ===== MONITORING ENDPOINTS =====

@app.route('/api/monitoring/schedules', methods=['GET'])
def get_schedules():
    """Get all scheduled scans for the authenticated user"""
    try:
        user_id = request.args.get('user_id') or 'test_user'
        
        if not user_id or user_id == 'null':
            return error_response("Valid user ID is required", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, url, frequency, last_run, next_run, is_active, 
                   alert_threshold, last_score, created_at
            FROM scheduled_scans
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        schedules = []
        for row in cursor.fetchall():
            schedules.append({
                'id': row['id'],
                'url': row['url'],
                'frequency': row['frequency'],
                'last_run': row['last_run'],
                'next_run': row['next_run'],
                'is_active': bool(row['is_active']),
                'alert_threshold': row['alert_threshold'],
                'last_score': row['last_score'],
                'created_at': row['created_at']
            })
        
        conn.close()
        
        return success_response({'schedules': schedules})
        
    except Exception as e:
        print(f"❌ Error fetching schedules: {e}")
        return error_response(
            "Failed to fetch schedules. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/monitoring/schedules', methods=['POST'])
def create_schedule():
    """Create a new scheduled scan"""
    try:
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)
        
        user_id = data.get('user_id') or 'test_user'
        url = data.get('url', '').strip()
        frequency = data.get('frequency', 'daily').lower()
        alert_threshold = data.get('alert_threshold', 10)
        
        # Validate URL
        is_valid, result = validate_url(url)
        if not is_valid:
            return error_response(result, 400)
        
        url = sanitize_url(result if is_valid else url)
        
        # Validate frequency
        if frequency not in app.config['VALID_FREQUENCIES']:
            return error_response(
                f"Invalid frequency. Must be one of: {', '.join(app.config['VALID_FREQUENCIES'])}",
                400
            )
        
        # Validate alert_threshold
        try:
            alert_threshold = int(alert_threshold)
            if alert_threshold < 1 or alert_threshold > 100:
                return error_response("Alert threshold must be between 1 and 100", 400)
        except (ValueError, TypeError):
            return error_response("Alert threshold must be a number", 400)
        
        next_run = calculate_next_run(frequency)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO scheduled_scans 
            (user_id, url, frequency, next_run, alert_threshold, is_active)
            VALUES (?, ?, ?, ?, ?, TRUE)
        ''', (user_id, url, frequency, next_run.isoformat(), alert_threshold))
        
        schedule_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Created schedule {schedule_id} for {url}")
        
        return success_response(
            {'schedule_id': schedule_id},
            'Schedule created successfully'
        ), 201
        
    except Exception as e:
        print(f"❌ Error creating schedule: {e}")
        return error_response(
            "Failed to create schedule. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/monitoring/schedules/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    """Delete a scheduled scan"""
    try:
        if schedule_id <= 0:
            return error_response("Invalid schedule ID", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if schedule exists
        cursor.execute('SELECT id FROM scheduled_scans WHERE id = ?', (schedule_id,))
        if not cursor.fetchone():
            conn.close()
            return error_response("Schedule not found", 404, "not_found")
        
        cursor.execute('DELETE FROM scheduled_scans WHERE id = ?', (schedule_id,))
        conn.commit()
        conn.close()
        
        return success_response(message='Schedule deleted successfully')
        
    except Exception as e:
        print(f"❌ Error deleting schedule: {e}")
        return error_response(
            "Failed to delete schedule. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/monitoring/schedules/<int:schedule_id>/toggle', methods=['PUT'])
def toggle_schedule(schedule_id):
    """Toggle a schedule on/off"""
    try:
        if schedule_id <= 0:
            return error_response("Invalid schedule ID", 400)
        
        data = request.get_json()
        if not data:
            return error_response("Request body is required", 400)
        
        is_active = data.get('is_active')
        if is_active is None:
            return error_response("is_active field is required", 400)
        
        if not isinstance(is_active, bool):
            return error_response("is_active must be a boolean", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if schedule exists
        cursor.execute('SELECT id FROM scheduled_scans WHERE id = ?', (schedule_id,))
        if not cursor.fetchone():
            conn.close()
            return error_response("Schedule not found", 404, "not_found")
        
        cursor.execute('''
            UPDATE scheduled_scans 
            SET is_active = ?
            WHERE id = ?
        ''', (is_active, schedule_id))
        
        conn.commit()
        conn.close()
        
        return success_response(message=f'Schedule {"enabled" if is_active else "disabled"} successfully')
        
    except Exception as e:
        print(f"❌ Error toggling schedule: {e}")
        return error_response(
            "Failed to toggle schedule. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/monitoring/alerts', methods=['GET'])
def get_alerts():
    """Get alert history for user"""
    try:
        user_id = request.args.get('user_id') or 'test_user'
        
        if not user_id or user_id == 'null':
            return error_response("Valid user ID is required", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, url, message, old_score, new_score, sent_at
            FROM alert_history
            WHERE user_id = ?
            ORDER BY sent_at DESC
            LIMIT 50
        ''', (user_id,))
        
        alerts = []
        for row in cursor.fetchall():
            alerts.append({
                'id': row['id'],
                'url': row['url'],
                'message': row['message'],
                'old_score': row['old_score'],
                'new_score': row['new_score'],
                'sent_at': row['sent_at']
            })
        
        conn.close()
        
        return success_response({'alerts': alerts})
        
    except Exception as e:
        print(f"❌ Error fetching alerts: {e}")
        return error_response(
            "Failed to fetch alerts. Please try again.",
            500,
            "database_error"
        )

@app.route('/api/monitoring/email/preferences', methods=['GET'])
def get_email_preferences():
    """Get email preferences for user"""
    try:
        user_id = request.args.get('user_id') or 'test_user'
        
        if not user_id or user_id == 'null':
            return error_response("Valid user ID is required", 400)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT email_enabled, smtp_configured
            FROM email_preferences
            WHERE user_id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        
        if row:
            preferences = {
                'email_enabled': bool(row['email_enabled']),
                'smtp_configured': bool(row['smtp_configured'])
            }
        else:
            cursor.execute('''
                INSERT INTO email_preferences (user_id, email_enabled, smtp_configured)
                VALUES (?, TRUE, FALSE)
            ''', (user_id,))
            conn.commit()
            preferences = {
                'email_enabled': True,
                'smtp_configured': False
            }
        
        conn.close()
        
        return success_response({'preferences': preferences})
        
    except Exception as e:
        print(f"❌ Error fetching email preferences: {e}")
        return error_response(
            "Failed to fetch preferences. Please try again.",
            500,
            "database_error"
        )

# ===== HEALTH CHECK =====

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return success_response({
        'service': 'WebSecura Backend',
        'version': '1.0.0',
        'scheduler_available': SCHEDULER_AVAILABLE
    })

# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return error_response("Endpoint not found", 404, "not_found")

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return error_response("Method not allowed", 405, "method_not_allowed")

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    print(f"❌ Internal server error: {error}")
    return error_response(
        "An internal server error occurred. Please try again.",
        500,
        "internal_error"
    )

# ===== STARTUP =====

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 WebSecura Backend Starting...")
    print("="*60)
    print(f"   Database: {app.config['DATABASE']}")
    print("   CORS: localhost:3000, localhost:3002")
    print("   Clerk Integration: Enabled")
    print("   Monitoring: Enabled")
    
    # Start automated scheduler
    if SCHEDULER_AVAILABLE:
        print("   Automated Scheduler: Starting...")
        try:
            scheduler_thread = start_scheduler_thread()
            print("   Automated Scheduler: ✓ Running")
        except Exception as e:
            print(f"   Automated Scheduler: ⚠️  Failed to start ({e})")
    else:
        print("   Automated Scheduler: ⚠️  Not available")
        print("   Install with: pip install schedule")
    
    print("="*60)
    print("\n✅ Server ready!\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)