import sqlite3

# Connect to the database
conn = sqlite3.connect('../replays/F1_2019_7d7c0ab8397c4564.sqlite3')
cursor = conn.cursor()

# Check table structure
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", tables)

if tables:
    table_name = tables[0][0]
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    print(f"\nColumns in {table_name}:")
    for col in columns:
        print(col)
    
    # Check available packet IDs
    try:
        cursor.execute(f"SELECT DISTINCT packetId FROM {table_name} LIMIT 10")
        packet_ids = cursor.fetchall()
        print(f"\nAvailable packet IDs: {packet_ids}")
    except Exception as e:
        print(f"Error checking packet IDs: {e}")

conn.close()
