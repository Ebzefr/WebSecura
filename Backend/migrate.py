import sqlite3

def migrate_database():
    """Migrate database to support monitoring features"""
    conn = sqlite3.connect('websecura.db')
    cursor = conn.cursor()
    
    print("\n🔄 Starting database migration...\n")
    
    # ===== 1. Scan History Table Updates =====
    print("📊 Updating scan_history table...")
    scan_history_columns = [
        ('security_score', 'INTEGER'),
        ('performance_score', 'INTEGER'),
        ('overall_score', 'INTEGER'),
        ('total_checks', 'INTEGER'),
        ('passed_checks', 'INTEGER'),
        ('failed_checks', 'INTEGER')
    ]
    
    for column_name, column_type in scan_history_columns:
        try:
            cursor.execute(f'ALTER TABLE scan_history ADD COLUMN {column_name} {column_type}')
            print(f"  ✓ Added column: {column_name}")
        except sqlite3.OperationalError as e:
            if 'duplicate column' in str(e).lower():
                print(f"  ⚠ Column {column_name} already exists")
            else:
                print(f"  ✗ Error: {e}")
    
    # ===== 2. Create Scheduled Scans Table =====
    print("\n⏰ Creating scheduled_scans table...")
    try:
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
        print("  ✓ scheduled_scans table ready")
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    # ===== 3. Create Alert History Table =====
    print("\n🚨 Creating alert_history table...")
    try:
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
        print("  ✓ alert_history table ready")
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    # ===== 4. Create Email Preferences Table =====
    print("\n📧 Creating email_preferences table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                email_enabled BOOLEAN DEFAULT TRUE,
                smtp_configured BOOLEAN DEFAULT FALSE
            )
        ''')
        print("  ✓ email_preferences table ready")
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    # ===== 5. Verify Tables Exist =====
    print("\n🔍 Verifying all tables...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    required_tables = ['scan_history', 'scheduled_scans', 'alert_history', 'email_preferences']
    for table in required_tables:
        if table in tables:
            print(f"  ✓ {table}")
        else:
            print(f"  ✗ {table} - MISSING!")
    
    # ===== 6. Show Table Schemas =====
    print("\n📋 Current table schemas:")
    for table in required_tables:
        if table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            print(f"\n  {table}:")
            for col in columns:
                print(f"    - {col[1]} ({col[2]})")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Database migration completed!\n")

if __name__ == '__main__':
    migrate_database()