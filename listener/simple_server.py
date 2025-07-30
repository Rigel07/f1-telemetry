import json
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS

print("Starting F1 Telemetry Server (Minimal Version)...")
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Get the directory of this script and look for replays
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_REPLAYS = os.path.join(SCRIPT_DIR, "replays")

# Create replays folder if it doesn't exist
if not os.path.exists(LOCAL_REPLAYS):
    os.makedirs(LOCAL_REPLAYS, exist_ok=True)
    print(f"Created replays folder: {LOCAL_REPLAYS}")

REPLAYS_FOLDER = LOCAL_REPLAYS
print(f"Using replays folder: {REPLAYS_FOLDER}")

@app.route('/')
def health():
    return jsonify({
        "message": "F1 Telemetry Server is running!",
        "status": "healthy",
        "replays_folder": REPLAYS_FOLDER,
        "replays_exist": os.path.exists(REPLAYS_FOLDER),
        "version": "minimal"
    })

@app.route('/api/health')
def api_health():
    return jsonify({"status": "healthy", "service": "f1-telemetry"})

@app.route('/api/replays', methods=['GET'])
def get_available_replays():
    """Get list of available replay files"""
    try:
        replay_files = []
        if os.path.exists(REPLAYS_FOLDER):
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
    """Minimal replay data endpoint - returns placeholder data"""
    try:
        return jsonify({
            'session_info': {'message': 'Upload replay files to see data'},
            'lap_data': [],
            'participants': [],
            'telemetry': [],
            'leaderboard': [
                {
                    'position': 1,
                    'driver_name': 'Demo Driver 1',
                    'team_id': 1,
                    'current_lap': 1,
                    'last_lap_time': 90.5,
                    'best_lap_time': 89.2,
                    'gap_to_leader': 0,
                    'gap_to_ahead': 0,
                    'is_player': True
                },
                {
                    'position': 2,
                    'driver_name': 'Demo Driver 2',
                    'team_id': 2,
                    'current_lap': 1,
                    'last_lap_time': 91.2,
                    'best_lap_time': 90.1,
                    'gap_to_leader': 2.3,
                    'gap_to_ahead': 2.3,
                    'is_player': False
                }
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/replay/<filename>/live', methods=['GET'])
def get_live_leaderboard(filename):
    """Minimal live leaderboard endpoint"""
    try:
        return jsonify({
            'leaderboard': [
                {
                    'position': 1,
                    'driver_name': 'Demo Driver 1',
                    'team_id': 1,
                    'current_lap': 1,
                    'gap_to_leader': 0,
                    'gap_to_ahead': 0,
                    'is_player': True
                }
            ],
            'current_time': 0,
            'max_time': 100,
            'progress_percent': 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tutorial/status', methods=['GET'])
def get_tutorial_status():
    """Check if user has seen the tutorial"""
    try:
        return jsonify({'has_seen_tutorial': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tutorial/complete', methods=['POST'])
def complete_tutorial():
    """Mark tutorial as completed for user"""
    try:
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
