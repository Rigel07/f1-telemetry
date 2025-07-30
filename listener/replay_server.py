import json
import sqlite3
import os
import urllib.parse
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS

print("Starting F1 Telemetry Server...")
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())

try:
    from f1_2020_telemetry.packets import unpack_udp_packet
    print("Successfully imported f1_2020_telemetry")
except ImportError as e:
    print(f"Warning: Could not import f1_2020_telemetry: {e}")
    # Define a dummy function to prevent crashes
    def unpack_udp_packet(*args, **kwargs):
        return None

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Get the directory of this script and look for replays
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# First try local replays folder (for deployment), then parent replays folder (for development)
LOCAL_REPLAYS = os.path.join(SCRIPT_DIR, "replays")
PARENT_REPLAYS = os.path.join(os.path.dirname(SCRIPT_DIR), "replays")

if os.path.exists(LOCAL_REPLAYS):
    REPLAYS_FOLDER = LOCAL_REPLAYS
    print(f"Using local replays folder: {REPLAYS_FOLDER}")
elif os.path.exists(PARENT_REPLAYS):
    REPLAYS_FOLDER = PARENT_REPLAYS
    print(f"Using parent replays folder: {REPLAYS_FOLDER}")
else:
    # Create local replays folder if neither exists
    REPLAYS_FOLDER = LOCAL_REPLAYS
    os.makedirs(REPLAYS_FOLDER, exist_ok=True)
    print(f"Created and using replays folder: {REPLAYS_FOLDER}")

@app.route('/')
def health():
    return jsonify({
        "message": "F1 Telemetry Server is running!",
        "status": "healthy",
        "replays_folder": REPLAYS_FOLDER,
        "replays_exist": os.path.exists(REPLAYS_FOLDER)
    })

@app.route('/api/health')
def api_health():
    return jsonify({"status": "healthy", "service": "f1-telemetry"})

@app.route('/api/replays', methods=['GET'])
def get_available_replays():
    """Get list of available replay files"""
    try:
        replay_files = []
        for filename in os.listdir(REPLAYS_FOLDER):
            if filename.endswith('.sqlite3'):
                replay_files.append({
                    'filename': filename,
                    'display_name': filename.replace('.sqlite3', '')
                })
        return jsonify(replay_files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/replay/<filename>', methods=['GET'])
def get_replay_data(filename):
    """Process a specific replay file and return race data"""
    try:
        filename = urllib.parse.unquote(filename)
        filepath = os.path.join(REPLAYS_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Replay file not found'}), 404
        
        # Connect to the database
        conn = sqlite3.connect(filepath)
        cursor = conn.cursor()
        
        race_data = {
            'session_info': {},
            'lap_data': [],
            'participants': [],
            'telemetry': [],
            'leaderboard': []
        }
        
        # Get session data (packet ID 1)
        cursor.execute("SELECT packet FROM packets WHERE packetId = 1 LIMIT 1")
        session_row = cursor.fetchone()
        if session_row:
            session_pkt = unpack_udp_packet(session_row[0])
            race_data['session_info'] = {
                'track_id': session_pkt.trackId,
                'session_type': session_pkt.sessionType,
                'track_length': session_pkt.trackLength,
                'weather': session_pkt.weather
            }
        
        # Get participants data (packet ID 4)
        cursor.execute("SELECT packet FROM packets WHERE packetId = 4 LIMIT 1")
        participants_row = cursor.fetchone()
        if participants_row:
            participants_pkt = unpack_udp_packet(participants_row[0])
            for i, participant in enumerate(participants_pkt.participants):
                if participant.driverId != 255:  # Valid driver
                    race_data['participants'].append({
                        'index': i,
                        'driver_id': participant.driverId,
                        'name': participant.name.decode('utf-8').strip('\x00'),
                        'team_id': participant.teamId,
                        'nationality': participant.nationality
                    })
        
        # Get lap data (packet ID 2) - sample some data points
        cursor.execute("SELECT timestamp, packet FROM packets WHERE packetId = 2 ORDER BY timestamp LIMIT 100")
        for row in cursor:
            timestamp, packet_data = row
            lap_pkt = unpack_udp_packet(packet_data)
            player_lap = lap_pkt.lapData[lap_pkt.header.playerCarIndex]
            
            # Handle different F1 game versions - some attributes may not exist
            race_data['lap_data'].append({
                'timestamp': timestamp,
                'session_time': lap_pkt.header.sessionTime,
                'current_lap': player_lap.currentLapNum,
                'lap_time': getattr(player_lap, 'currentLapTime', 0),
                'sector1_time': getattr(player_lap, 'sector1Time', 0),
                'sector2_time': getattr(player_lap, 'sector2Time', 0),
                'lap_distance': getattr(player_lap, 'lapDistance', 0),
                'position': player_lap.carPosition
            })
        
        # Get telemetry data (packet ID 6) - sample some data points
        cursor.execute("SELECT timestamp, packet FROM packets WHERE packetId = 6 ORDER BY timestamp LIMIT 50")
        for row in cursor:
            timestamp, packet_data = row
            telemetry_pkt = unpack_udp_packet(packet_data)
            player_car = telemetry_pkt.carTelemetryData[telemetry_pkt.header.playerCarIndex]
            
            race_data['telemetry'].append({
                'timestamp': timestamp,
                'session_time': telemetry_pkt.header.sessionTime,
                'speed': player_car.speed,
                'gear': player_car.gear,
                'throttle': player_car.throttle,
                'brake': player_car.brake,
                'engine_rpm': player_car.engineRPM
            })
        
        # Generate leaderboard from lap data - get latest positions
        cursor.execute("""
            SELECT DISTINCT 
                l.playerCarIndex,
                l.sessionTime,
                l.packet
            FROM packets l
            WHERE l.packetId = 2 
            AND l.sessionTime = (
                SELECT MAX(sessionTime) 
                FROM packets 
                WHERE packetId = 2
            )
            ORDER BY l.sessionTime DESC
            LIMIT 1
        """)
        
        latest_lap_row = cursor.fetchone()
        if latest_lap_row:
            _, session_time, packet_data = latest_lap_row
            lap_pkt = unpack_udp_packet(packet_data)
            
            # Build leaderboard from all cars
            leaderboard_data = []
            for i, lap_data in enumerate(lap_pkt.lapData):
                if i < len(race_data['participants']):
                    participant = next((p for p in race_data['participants'] if p['index'] == i), None)
                    driver_name = participant['name'] if participant else f"Driver {i+1}"
                    team_id = participant['team_id'] if participant else 0
                else:
                    driver_name = f"Driver {i+1}"
                    team_id = 0
                
                leaderboard_data.append({
                    'position': lap_data.carPosition,
                    'driver_name': driver_name,
                    'team_id': team_id,
                    'current_lap': lap_data.currentLapNum,
                    'last_lap_time': getattr(lap_data, 'lastLapTime', 0),
                    'best_lap_time': getattr(lap_data, 'bestLapTime', 0),
                    'sector1_time': getattr(lap_data, 'sector1Time', 0),
                    'sector2_time': getattr(lap_data, 'sector2Time', 0),
                    'penalties': getattr(lap_data, 'penalties', 0),
                    'car_index': i
                })
            
            # Sort by position
            leaderboard_data.sort(key=lambda x: x['position'] if x['position'] > 0 else 999)
            race_data['leaderboard'] = leaderboard_data
        
        conn.close()
        return jsonify(race_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/replay/<filename>/live', methods=['GET'])
def get_live_leaderboard(filename):
    """Get live leaderboard data for replay progression"""
    try:
        filename = urllib.parse.unquote(filename)
        filepath = os.path.join(REPLAYS_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Replay file not found'}), 404
        
        # Get time parameter for progression
        session_time = request.args.get('time', type=float, default=0.0)
        
        conn = sqlite3.connect(filepath)
        cursor = conn.cursor()
        
        # Get participants data first
        participants = {}
        cursor.execute("SELECT packet FROM packets WHERE packetId = 4 LIMIT 1")
        participants_row = cursor.fetchone()
        if participants_row:
            participants_pkt = unpack_udp_packet(participants_row[0])
            for i, participant in enumerate(participants_pkt.participants):
                if participant.driverId != 255:
                    participants[i] = {
                        'name': participant.name.decode('utf-8').strip('\x00'),
                        'team_id': participant.teamId,
                        'nationality': participant.nationality
                    }
        
        # Get lap data at or before the requested time
        cursor.execute("""
            SELECT sessionTime, packet 
            FROM packets 
            WHERE packetId = 2 
            AND sessionTime <= ? 
            ORDER BY sessionTime DESC 
            LIMIT 1
        """, (session_time,))
        
        lap_row = cursor.fetchone()
        leaderboard = []
        current_session_time = session_time
        
        if lap_row:
            current_session_time, packet_data = lap_row
            lap_pkt = unpack_udp_packet(packet_data)
            
            # Build leaderboard with calculated gaps
            cars_data = []
            
            # First pass: collect all cars with valid positions
            for i, lap_data in enumerate(lap_pkt.lapData):
                if lap_data.carPosition > 0 and lap_data.carPosition <= 20:
                    participant = participants.get(i, {'name': f'Driver {i+1}', 'team_id': 0, 'nationality': 0})
                    
                    cars_data.append({
                        'position': lap_data.carPosition,
                        'driver_name': participant['name'],
                        'team_id': participant['team_id'],
                        'current_lap': lap_data.currentLapNum,
                        'last_lap_time': getattr(lap_data, 'lastLapTime', 0),
                        'best_lap_time': getattr(lap_data, 'bestLapTime', 0),
                        'sector1_time': getattr(lap_data, 'sector1Time', 0),
                        'sector2_time': getattr(lap_data, 'sector2Time', 0),
                        'penalties': getattr(lap_data, 'penalties', 0),
                        'pit_status': getattr(lap_data, 'pitStatus', 0),
                        'car_index': i,
                        'is_player': i == lap_pkt.header.playerCarIndex,
                        'total_distance': getattr(lap_data, 'totalDistance', 0),
                        'lap_distance': getattr(lap_data, 'lapDistance', 0),
                        'current_lap_time': getattr(lap_data, 'currentLapTime', 0)
                    })
            
            # Sort by position to identify leader
            cars_data.sort(key=lambda x: x['position'])
            
            # Calculate gaps to leader
            leader_distance = cars_data[0]['total_distance'] if cars_data else 0
            
            for car in cars_data:
                # Calculate distance gap in meters
                distance_gap = leader_distance - car['total_distance']
                
                # Convert to time gap (rough estimate using average F1 speed ~70 m/s)
                avg_speed = 70.0  # meters per second (about 250 km/h)
                time_gap = distance_gap / avg_speed if avg_speed > 0 and distance_gap > 0 else 0
                
                # For more precision on same lap, use lap distance
                if car['current_lap'] == cars_data[0]['current_lap'] and cars_data:
                    leader_lap_distance = cars_data[0]['lap_distance']
                    lap_distance_gap = leader_lap_distance - car['lap_distance']
                    time_gap = lap_distance_gap / avg_speed if avg_speed > 0 and lap_distance_gap > 0 else 0
                
                car['gap_to_leader'] = time_gap
                leaderboard.append(car)
            
            # Sort by position
            leaderboard.sort(key=lambda x: x['position'])
            
            # Calculate gap to car ahead (interval gap)
            for i, car in enumerate(leaderboard):
                if i == 0:  # Leader
                    car['gap_to_ahead'] = 0
                else:
                    # Get car ahead
                    car_ahead = leaderboard[i-1]
                    
                    # Use the gap_to_leader values to calculate interval
                    car_gap_to_leader = car.get('gap_to_leader', 0)
                    ahead_gap_to_leader = car_ahead.get('gap_to_leader', 0)
                    
                    # Interval gap is the difference in their gaps to leader
                    car['gap_to_ahead'] = car_gap_to_leader - ahead_gap_to_leader
                
                # Clean up temporary fields safely
                car.pop('total_distance', None)
                car.pop('lap_distance', None)
                car.pop('current_lap_time', None)
        
        # Get session duration for progress calculation
        cursor.execute("SELECT MAX(sessionTime) FROM packets WHERE packetId = 2")
        max_time_row = cursor.fetchone()
        max_session_time = max_time_row[0] if max_time_row and max_time_row[0] else 0
        
        conn.close()
        
        return jsonify({
            'leaderboard': leaderboard,
            'current_time': current_session_time,
            'max_time': max_session_time,
            'progress_percent': (current_session_time / max_session_time * 100) if max_session_time > 0 else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/replay/<filename>/info', methods=['GET'])
def get_replay_info(filename):
    """Get basic info about the replay file"""
    try:
        filepath = os.path.join(REPLAYS_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'Replay file not found'}), 404
        
        conn = sqlite3.connect(filepath)
        cursor = conn.cursor()
        
        # Get time bounds
        cursor.execute("SELECT MIN(sessionTime), MAX(sessionTime) FROM packets WHERE packetId = 2")
        time_bounds = cursor.fetchone()
        min_time = time_bounds[0] if time_bounds[0] else 0
        max_time = time_bounds[1] if time_bounds[1] else 0
        
        # Get total packet counts
        cursor.execute("SELECT packetId, COUNT(*) FROM packets GROUP BY packetId")
        packet_counts = dict(cursor.fetchall())
        
        # Get session info
        cursor.execute("SELECT packet FROM packets WHERE packetId = 1 LIMIT 1")
        session_row = cursor.fetchone()
        session_info = {}
        if session_row:
            session_pkt = unpack_udp_packet(session_row[0])
            session_info = {
                'track_id': session_pkt.trackId,
                'session_type': session_pkt.sessionType,
                'track_length': session_pkt.trackLength,
                'weather': session_pkt.weather
            }
        
        conn.close()
        
        return jsonify({
            'filename': filename,
            'min_time': min_time,
            'max_time': max_time,
            'duration': max_time - min_time,
            'packet_counts': packet_counts,
            'session_info': session_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/tutorial/status', methods=['GET'])
def get_tutorial_status():
    """Check if user has seen the tutorial"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        # For simplicity, we'll use a simple file-based storage
        # In production, you'd use a proper database
        tutorial_file = os.path.join(SCRIPT_DIR, 'tutorial_status.json')
        
        if os.path.exists(tutorial_file):
            with open(tutorial_file, 'r') as f:
                tutorial_data = json.load(f)
                return jsonify({
                    'has_seen_tutorial': tutorial_data.get(user_id, False)
                })
        else:
            return jsonify({'has_seen_tutorial': False})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tutorial/complete', methods=['POST'])
def complete_tutorial():
    """Mark tutorial as completed for user"""
    try:
        user_id = request.json.get('user_id', 'default_user')
        
        tutorial_file = os.path.join(SCRIPT_DIR, 'tutorial_status.json')
        tutorial_data = {}
        
        if os.path.exists(tutorial_file):
            with open(tutorial_file, 'r') as f:
                tutorial_data = json.load(f)
        
        tutorial_data[user_id] = True
        
        with open(tutorial_file, 'w') as f:
            json.dump(tutorial_data, f)
            
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', 5000))
        print(f"Starting server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
