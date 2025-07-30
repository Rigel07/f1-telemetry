# 🏎️ F1 Telemetry Viewer

# 🏎️ F1 Telemetry Viewer

A comprehensive web application for analyzing Formula 1 telemetry data from race replays. Dive deep into racing performance with advanced visualization tools, ghost car comparisons, and detailed telemetry analysis.

![F1 Telemetry Viewer](https://via.placeholder.com/800x400?text=F1+Telemetry+Viewer)

## ✨ Features

- **🏁 Advanced Race Replay**: Analyze races with comprehensive telemetry data and interactive controls
- **📊 Real-time Telemetry Dashboard**: Speedometer, RPM, gear indicators, and live data visualization
- **👻 Ghost Car Mode**: 3D telemetry replay comparing your current lap vs fastest lap
- **🗺️ Track Visualization**: 2D/3D track maps with car positions and sector markers
- **⚡ Dynamic Dashboard**: Animated speedometer with color-coded performance zones
- **🔄 Gap Analysis**: Toggle between gap to leader and interval gap views
- **🎮 F1 Game Integration**: Compatible with F1 2019/2020 game replay files
- **🎨 F1-Inspired Design**: Authentic F1 styling and professional racing interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- F1 game replay files (.sqlite3)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/f1-telemetry.git
   cd f1-telemetry
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Add your replay files**
   ```bash
   # Place your .sqlite3 replay files in the replays/ folder
   cp your-replay-file.sqlite3 replays/
   ```

5. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd listener
   python replay_server.py
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📖 How It Works

The F1 Telemetry Viewer processes telemetry data from F1 game replay files and presents it through an intuitive web interface:

1. **Data Processing**: The Python backend reads SQLite replay files containing UDP telemetry packets
2. **Real-time Simulation**: Live leaderboard updates simulate race progression
3. **Gap Calculations**: Intelligent algorithms calculate time gaps between drivers using distance data
4. **Interactive Controls**: Users can control playback speed and timeline position

## 🗂️ Project Structure

```
f1-telemetry/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── styles/            # CSS stylesheets
│   └── App.tsx           # Main application
├── listener/              # Python backend
│   └── replay_server.py  # Flask API server
├── replays/              # F1 replay files
├── public/               # Static assets
└── package.json         # Dependencies
```

## 🔧 Development

### Frontend Technologies
- **React 18** with TypeScript
- **Vite** for fast development
- **CSS3** with F1-inspired design
- **Responsive** mobile-friendly layout

### Backend Technologies
- **Flask** REST API
- **f1-2020-telemetry** packet processing
- **SQLite** database integration
- **CORS** enabled for frontend communication

## 🚀 Deployment Options

### Quick Demo (Render/Railway)
```bash
npm run build
# Deploy to Render, Railway, or Vercel
```

### Docker
```bash
docker-compose up -d
```

### Local Network
```bash
# Backend
python listener/replay_server.py --host 0.0.0.0

# Frontend  
npm run dev -- --host 0.0.0.0
```

## 🛣️ Roadmap

- [ ] � Ghost car mode with 3D track visualization
- [ ] 📈 Advanced telemetry charts with throttle/brake/gear analysis
- [ ] ⏱️ Lap timer with sector comparisons and delta indicators  
- [ ] 🎮 Enhanced car HUD with speedometer and RPM displays
- [ ] 🗺️ Real-time track maps with car positioning
- [ ] 🔍 Driver comparison tools and side-by-side analysis
- [ ] 💾 Custom replay file upload and management
- [ ] 📱 Mobile-optimized responsive interface
- [ ] 🎯 Performance analytics and racing insights
- [ ] 🏆 Lap time leaderboards and personal bests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [f1-2020-telemetry](https://github.com/f1telemetry/f1-2020-telemetry) for telemetry packet processing
- F1 game series for providing telemetry data
- The F1 community for inspiration and feedback

---

**Note**: This application requires F1 game replay files. Replay files are not included and must be generated through F1 2019/2020 gameplay.

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
