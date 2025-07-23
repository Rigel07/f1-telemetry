import json
import sqlite3
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from f1_2020_telemetry.packets import unpack_udp_packet

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

REPLAYS_FOLDER = "../replays"

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
            AND sessionTime >= ? 
            ORDER BY sessionTime ASC 
            LIMIT 1
        """, (session_time,))
        
        lap_row = cursor.fetchone()
        leaderboard = []
        current_session_time = 0
        
        if lap_row:
            current_session_time, packet_data = lap_row
            lap_pkt = unpack_udp_packet(packet_data)
            
            # Build leaderboard
            for i, lap_data in enumerate(lap_pkt.lapData):
                participant = participants.get(i, {'name': f'Driver {i+1}', 'team_id': 0, 'nationality': 0})
                
                leaderboard.append({
                    'position': lap_data.carPosition,
                    'driver_name': participant['name'],
                    'team_id': participant['team_id'],
                    'current_lap': lap_data.currentLapNum,
                    'last_lap_time': getattr(lap_data, 'lastLapTime', 0),
                    'best_lap_time': getattr(lap_data, 'bestLapTime', 0),
                    'sector1_time': getattr(lap_data, 'sector1Time', 0),
                    'sector2_time': getattr(lap_data, 'sector2Time', 0),
                    'gap_to_leader': getattr(lap_data, 'deltaToCarInFront', 0),
                    'penalties': getattr(lap_data, 'penalties', 0),
                    'pit_status': getattr(lap_data, 'pitStatus', 0),
                    'car_index': i
                })
            
            # Sort by position
            leaderboard.sort(key=lambda x: x['position'] if x['position'] > 0 else 999)
        
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
