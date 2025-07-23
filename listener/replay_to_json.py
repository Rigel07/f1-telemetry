# This file has been replaced by replay_server.py
# The new workflow uses a Flask API server that serves replay data to the frontend
# Run: python replay_server.py to start the API server
# Then access the frontend at http://localhost:5174 to view replay data

import json
import sqlite3
import time
from f1_2020_telemetry.packets import unpack_udp_packet

# Change the filename below to match your actual recording
FILENAME = "F1_2019_7d7c0ab8397c4564.sqlite3"

# Replay at real speed (1.0 = real time, 2.0 = double speed)
realtime_factor = 1.0

print("Note: This script now just prints telemetry data.")
print("For the full web interface, use replay_server.py instead.")
print("=" * 50)

# Connect to the SQLite database
conn = sqlite3.connect(FILENAME)
cursor = conn.cursor()

# Query for CarTelemetry packets (packetId = 6) ordered by timestamp
cursor.execute("SELECT timestamp, sessionTime, packet FROM packets WHERE packetId = 6 ORDER BY timestamp")

prev_timestamp = None
start_time = time.time()

for row in cursor:
    timestamp, session_time, packet_data = row
    
    # Unpack the UDP packet
    pkt = unpack_udp_packet(packet_data)
    
    # Handle timing for real-time playback
    if prev_timestamp is not None and realtime_factor > 0:
        elapsed_real = (timestamp - prev_timestamp) / realtime_factor
        time.sleep(max(0, elapsed_real - (time.time() - start_time)))
        start_time = time.time()
    
    prev_timestamp = timestamp
    
    # Extract telemetry data for the player car
    car = pkt.carTelemetryData[pkt.header.playerCarIndex]
    
    print(json.dumps({
        "time":     pkt.header.sessionTime,
        "speed":    car.speed,
        "gear":     car.gear,
        "throttle": car.throttle,
        "brake":    car.brake,
    }), flush=True)

conn.close()
