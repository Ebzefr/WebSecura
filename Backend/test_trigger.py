#!/usr/bin/env python3
# Backend/test_trigger.py
# Manually trigger scheduled scans for testing

import sqlite3
from datetime import datetime, timedelta

DATABASE = 'websecura.db'

def trigger_all_schedules():
    """Set all active schedules to run NOW"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get all active schedules
    cursor.execute('SELECT id, url FROM scheduled_scans WHERE is_active = TRUE')
    schedules = cursor.fetchall()
    
    if not schedules:
        print("❌ No active schedules found!")
        print("   Create a schedule in the Monitoring page first.")
        conn.close()
        return
    
    # Set next_run to 1 minute ago (to trigger immediately)
    past_time = (datetime.now() - timedelta(minutes=1)).isoformat()
    
    for schedule_id, url in schedules:
        cursor.execute('''
            UPDATE scheduled_scans 
            SET next_run = ?
            WHERE id = ?
        ''', (past_time, schedule_id))
        print(f"✅ Triggered schedule #{schedule_id} for {url}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✓ Updated {len(schedules)} schedule(s)")
    print("✓ They will run within the next minute!")
    print("\n👀 Watch your backend console for scan activity...")

if __name__ == '__main__':
    print("\n🧪 WebSecura Schedule Trigger\n")
    trigger_all_schedules()