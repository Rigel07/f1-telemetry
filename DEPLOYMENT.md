# 🏁 F1 Telemetry Viewer - Deployment Guide

## 📋 Project Overview
F1 Telemetry Viewer is a React + Flask application for analyzing F1 race replay data with interactive dashboards, tooltips, and tutorial system.

## 🏗️ Architecture
- **Frontend**: React 18 + TypeScript + Vite (Deploy to Vercel)
- **Backend**: Flask + Python (Deploy to Railway/Render/Heroku)
- **Data**: SQLite replay files (must be added manually due to size)

## 🚀 Quick Deployment

### 1. Backend Deployment (Railway/Render recommended)

#### Option A: Railway (Recommended)
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy from the root directory (Railway will auto-detect the Procfile)
4. **Important**: Add your replay files to `listener/replays/` after deployment
5. Note your deployment URL (e.g., `https://your-app.railway.app`)

#### Option B: Render
1. Create account at [render.com](https://render.com)
2. Create a new Web Service from your GitHub repo
3. Configure:
   - **Build Command**: `cd listener && pip install -r ../requirements.txt`
   - **Start Command**: `cd listener && gunicorn replay_server:app`
   - **Environment**: Python 3.11+

### 2. Frontend Deployment (Vercel)

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - **VITE_API_URL**: `https://your-backend-url.com`

### 3. Add Replay Files (IMPORTANT!)

Since replay files are too large for GitHub, you need to add them manually:

1. **Download your F1 replay files** (`.sqlite3` format)
2. **Upload to your backend deployment**:
   - For Railway: Use Railway CLI or file manager
   - For Render: Use SSH or file upload feature
3. **Place files in**: `listener/replays/` directory
4. **Restart backend service**

## 📁 Required File Structure for Backend
```
listener/
├── replays/              # Add your replay files here!
│   ├── your-race-1.sqlite3
│   ├── your-race-2.sqlite3
│   └── ...
├── replay_server.py      # Main Flask backend
├── gunicorn.conf.py      # Production server config
└── tutorial_status.json  # Auto-created
```

## 🎯 Features Deployed

### Current Features
- ✅ Interactive Leaderboard Dashboard
- ✅ Tutorial system with tooltips
- ✅ Replay file selection
- ✅ Real-time race progression
- ✅ Gap analysis (Leader vs Interval)
- ✅ Session info display

### Tutorial System
- First-time visitor tutorial (automatically shown)
- Collapsible summary with F1 session types explanation
- Tooltips on all interactive elements
- Manual tutorial re-trigger button
- Backend tracking of tutorial completion

### Coming Soon
- 🏎️ Live Race Replay with real-time telemetry controls
- 📊 Advanced Telemetry with speedometer and gear indicators
- 👻 Ghost Car Mode with 3D track visualization
- ⚡ Advanced Dashboard with lap timers and sector comparisons
- 🗺️ Track Visualization with 2D/3D maps
- 📈 Telemetry charts with throttle/brake/gear analysis
- 🎮 Car HUD with speedometer and RPM bar
- 📱 Mobile-optimized responsive interface

## 🔧 Configuration

### Backend Environment Variables
No additional environment variables needed - the app auto-detects replay files.

### Frontend Environment Variables
```env
# Production
VITE_API_URL=https://your-backend-url.com
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Local Development
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt

# Run backend (from listener/ directory)
cd listener
python replay_server.py

# Run frontend (from root directory)
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Test production build locally
npm run preview
```

## 🔍 API Endpoints

### Backend API
- `GET /api/replays` - List available replay files
- `GET /api/replay/{filename}` - Get race data from replay
- `GET /api/replay/{filename}/live?time={seconds}` - Get live leaderboard at time
- `GET /api/replay/{filename}/info` - Get replay metadata
- `GET /api/tutorial/status?user_id={id}` - Check tutorial status
- `POST /api/tutorial/complete` - Mark tutorial complete
- `GET /api/health` - Health check

## 🎮 Usage Guide

### For First-Time Users
1. **Tutorial**: Automatically shown on first visit
2. **Dashboard Summary**: Explains session types and column meanings
3. **Tooltips**: Hover over any button/element for help
4. **Skip Option**: Tutorial can be skipped or re-triggered

### Session Analysis
1. Select a replay file from dropdown
2. Use play/pause controls for real-time progression
3. Scrub timeline with slider for specific moments
4. Toggle between "Gap to Leader" and "Interval Gap" modes
5. Adjust playback speed (0.5x to 10x)

## 🐛 Troubleshooting

### Common Issues
1. **No Replay Files**: Ensure `.sqlite3` files are in `listener/replays/`
2. **CORS Errors**: Ensure backend URL is correct in frontend env
3. **Tutorial Not Showing**: Clear browser cache or check backend logs
4. **Empty Leaderboard**: Try different time points (some sessions start slowly)

### Backend Logs
- Check deployment platform logs for Python errors
- Tutorial status stored in `tutorial_status.json`
- Replay files auto-detected from `listener/replays/` directory

## 🎨 Customization

### Adding New Replay Files
1. Copy `.sqlite3` files to `listener/replays/`
2. Restart backend service
3. Files will appear in dropdown automatically

### Modifying Tutorial
- Edit `src/components/Tutorial.tsx` for content
- Backend tracks completion in `tutorial_status.json`
- Tooltips defined in individual components

## 🏆 Performance Notes
- SQLite files can be large (100MB+) - consider CDN for production
- Leaderboard updates every second during playback
- Time slider is debounced (300ms) to prevent API spam
- Mobile-optimized but large data sets may impact performance

## 📞 Support
- GitHub Issues: Report bugs and feature requests
- Documentation: This deployment guide
- Tutorial: Built-in help system for users

---

**Ready to deploy! 🚀** Your F1 Telemetry Viewer is production-ready with professional features, comprehensive tutorials, and scalable architecture.
