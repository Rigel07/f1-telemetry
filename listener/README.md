# F1 Telemetry Replay System

This project allows you to replay F1 telemetry data from SQLite recordings and display them in a web interface.

## Architecture

- **Backend**: Flask API server that processes SQLite replay files
- **Frontend**: React application that displays the race data
- **Data Flow**: User selects replay → API processes data → Frontend displays results

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd listener
pip install flask flask-cors f1-2020-telemetry
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Start the Backend Server

```bash
cd listener
python replay_server.py
```

The API server will start on `http://localhost:5000`

### 4. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5174` (or the next available port)

## Usage

1. **Select a Replay**: Open the frontend in your browser and use the dropdown to select a replay file
2. **View Data**: The system will automatically load and display:
   - Session information (track, weather, etc.)
   - Participant list with driver names and teams
   - Real-time telemetry data (speed, gear, throttle, brake, RPM)
   - Lap information (current lap, position, distance)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/replays` - List available replay files
- `GET /api/replay/<filename>` - Get processed data for a specific replay

## Data Extracted

The system extracts the following data from F1 2019/2020 telemetry:

### Session Info (Packet ID 1)
- Track ID
- Session type
- Track length
- Weather conditions

### Participants (Packet ID 4)
- Driver names
- Team IDs
- Nationalities
- Driver IDs

### Lap Data (Packet ID 2)
- Current lap number
- Lap times
- Sector times
- Position
- Lap distance

### Telemetry (Packet ID 6)
- Speed
- Current gear
- Throttle position
- Brake position
- Engine RPM

## File Structure

```
├── listener/
│   ├── replay_server.py      # Flask API server
│   ├── replay_to_json.py     # Original script (now legacy)
│   └── inspect_db.py         # Database inspection utility
├── replays/
│   └── *.sqlite3             # F1 telemetry recordings
├── src/
│   ├── components/
│   │   └── Leaderboard.tsx   # Main display component
│   └── styles/
│       └── Leaderboard.css   # Styling
└── package.json              # Frontend dependencies
```

## Notes

- No WebSockets required since this processes static replay data
- The system automatically discovers replay files in the `replays/` folder
- Data is processed on-demand when a replay is selected
- CORS is enabled for local development
