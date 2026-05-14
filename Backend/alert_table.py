#!/usr/bin/env python3
# Backend/rebuild_alert_table.py
# Rebuild alert_history table with correct schema

import sqlite3

DATABASE = 'websecura.db'

def rebuild_alert_table():
    """Drop and recreate alert_history table with url column"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    print("\n🔨 Rebuilding alert_history table...\n")
    
    # 1. Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alert_history'")
    table_exists = cursor.fetchone() is not None
    
    if table_exists:
        print("📋 Current alert_history schema:")
        cursor.execute("PRAGMA table_info(alert_history)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # 2. Backup existing data (if any)
        cursor.execute("SELECT COUNT(*) FROM alert_history")
        count = cursor.fetchone()[0]
        print(f"\n📊 Current records: {count}")
        
        if count > 0:
            print("⚠️  Backing up existing alerts...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alert_history_backup AS 
                SELECT * FROM alert_history
            """)
            print("  ✓ Backup created as 'alert_history_backup'")
        
        # 3. Drop old table
        print("\n🗑️  Dropping old alert_history table...")
        cursor.execute("DROP TABLE alert_history")
        print("  ✓ Old table dropped")
    
    # 4. Create new table with correct schema
    print("\n✨ Creating new alert_history table...")
    cursor.execute('''
        CREATE TABLE alert_history (
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
    print("  ✓ New table created")
    
    # 5. Verify new schema
    print("\n✅ New alert_history schema:")
    cursor.execute("PRAGMA table_info(alert_history)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Check for url column
    column_names = [col[1] for col in columns]
    if 'url' in column_names:
        print("\n🎉 SUCCESS! 'url' column is present!")
    else:
        print("\n❌ ERROR: 'url' column still missing!")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Alert history table rebuilt!\n")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🔨 WebSecura Alert History Table Rebuild")
    print("="*60)
    rebuild_alert_table()