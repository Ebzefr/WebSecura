
import schedule
import time
import threading
import sqlite3
from datetime import datetime, timedelta
import sys
import os

# Add scanner to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scanner'))
from scanner.security_scanner import SecurityScanner
from scanner.performance_analyzer import PerformanceAnalyzer

DATABASE = 'websecura.db'
scanner = SecurityScanner()
performance_analyzer = PerformanceAnalyzer()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def calculate_next_run(frequency):
    """Calculate next run time"""
    now = datetime.now()
    if frequency == 'hourly':
        return now + timedelta(hours=1)
    elif frequency == 'daily':
        return now + timedelta(days=1)
    elif frequency == 'weekly':
        return now + timedelta(weeks=1)
    elif frequency == 'monthly':
        return now + timedelta(days=30)
    return now + timedelta(days=1)

def run_scheduled_scan(schedule_id, user_id, url, frequency, alert_threshold, last_score):
    """Execute a scheduled scan"""
    print(f"\n{'='*60}")
    print(f"🤖 AUTOMATED SCAN")
    print(f"Schedule ID: {schedule_id}")
    print(f"URL: {url}")
    print(f"Frequency: {frequency}")
    print(f"{'='*60}\n")
    
    try:
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Run security scan
        print(f"🔍 Running security scan...")
        security_results = scanner.scan_website(url)
        
        # Run performance analysis
        print(f"⚡ Running performance analysis...")
        performance_results = performance_analyzer.analyze_website(url)
        
        # Calculate scores
        total_checks = len(security_results)
        passed_checks = len([r for r in security_results if r['passed']])
        security_score = int((passed_checks / total_checks) * 100) if total_checks > 0 else 0
        performance_score = performance_results.get('overall_score', 0)
        overall_score = int((security_score + performance_score) / 2)
        
        print(f"✅ Scan complete: Overall Score = {overall_score}")
        
        # Update schedule
        conn = get_db()
        cursor = conn.cursor()
        
        next_run = calculate_next_run(frequency)
        
        cursor.execute('''
            UPDATE scheduled_scans 
            SET last_run = ?, next_run = ?, last_score = ?
            WHERE id = ?
        ''', (datetime.now().isoformat(), next_run.isoformat(), overall_score, schedule_id))
        
        conn.commit()
        
        # Check if score dropped significantly
        if last_score is not None and last_score > 0:
            score_drop = last_score - overall_score
            
            if score_drop >= alert_threshold:
                print(f"⚠️  ALERT: Score dropped by {score_drop} points (threshold: {alert_threshold})")
                
                # Create alert
                message = f"Security score dropped by {score_drop} points: {last_score} → {overall_score}"
                
                cursor.execute('''
                    INSERT INTO alert_history 
                    (scheduled_scan_id, user_id, url, message, old_score, new_score)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (schedule_id, user_id, url, message, last_score, overall_score))
                
                conn.commit()
                print(f"📧 Alert created and saved to database")
            else:
                print(f"✓ Score change within threshold: {last_score} → {overall_score} (change: {score_drop})")
        else:
            print(f"ℹ️  First scan for this schedule - establishing baseline score")
        
        conn.close()
        print(f"✅ Schedule {schedule_id} updated successfully\n")
        
    except Exception as e:
        print(f"❌ Error running scheduled scan: {e}")
        import traceback
        traceback.print_exc()

def check_and_run_due_scans():
    """Check for scans that are due and run them"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Find all active schedules that are due
        now = datetime.now().isoformat()
        
        cursor.execute('''
            SELECT id, user_id, url, frequency, alert_threshold, last_score
            FROM scheduled_scans
            WHERE is_active = TRUE 
            AND next_run <= ?
        ''', (now,))
        
        due_scans = cursor.fetchall()
        conn.close()
        
        if due_scans:
            print(f"\n🔔 Found {len(due_scans)} due scan(s)")
            
            for scan in due_scans:
                run_scheduled_scan(
                    scan['id'],
                    scan['user_id'],
                    scan['url'],
                    scan['frequency'],
                    scan['alert_threshold'],
                    scan['last_score']
                )
        else:
            print(f"✓ No scans due at {datetime.now().strftime('%H:%M:%S')}")
            
    except Exception as e:
        print(f"❌ Error checking due scans: {e}")

def run_scheduler():
    """Main scheduler loop"""
    print("\n" + "="*60)
    print("🤖 WebSecura Automated Scan Scheduler")
    print("="*60)
    print("✓ Scheduler started")
    print("✓ Checking for due scans every minute")
    print("✓ Press Ctrl+C to stop\n")
    
    # Schedule the check to run every minute
    schedule.every(1).minutes.do(check_and_run_due_scans)
    
    # Run once immediately on startup
    check_and_run_due_scans()
    
    # Keep running
    while True:
        try:
            schedule.run_pending()
            time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n🛑 Scheduler stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Scheduler error: {e}")
            time.sleep(60)  # Wait a minute before retrying

def start_scheduler_thread():
    """Start scheduler in background thread"""
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    return scheduler_thread

if __name__ == '__main__':
    run_scheduler()