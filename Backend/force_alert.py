#!/usr/bin/env python3
# Backend/force_alert.py
# Force an alert by setting a high baseline score

import sqlite3
from datetime import datetime, timedelta

DATABASE = 'websecura.db'

def force_alert():
    """Set a high last_score to trigger alert on next scan"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get all active schedules
    cursor.execute('SELECT id, url, last_score FROM scheduled_scans WHERE is_active = TRUE')
    schedules = cursor.fetchall()
    
    if not schedules:
        print("❌ No active schedules found!")
        conn.close()
        return
    
    # Set high baseline score and trigger next run
    past_time = (datetime.now() - timedelta(minutes=1)).isoformat()
    
    for schedule_id, url, last_score in schedules:
        # Set last_score to 95 (very high) to guarantee alert
        cursor.execute('''
            UPDATE scheduled_scans 
            SET last_score = 95, next_run = ?
            WHERE id = ?
        ''', (past_time, schedule_id))
        print(f"✅ Schedule #{schedule_id}: Set baseline to 95")
        print(f"   URL: {url}")
        print(f"   Previous score: {last_score}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✓ Updated {len(schedules)} schedule(s)")
    print("✓ Next scan will likely trigger an alert!")
    print("\n👀 Watch backend console...")

if __name__ == '__main__':
    print("\n⚠️  Force Alert Test\n")
    force_alert()