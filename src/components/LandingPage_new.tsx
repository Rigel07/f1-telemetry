import { useState } from 'react'
import '../styles/LandingPage.css'

interface LandingPageProps {
  onGetStarted: () => void
}

function LandingPage({ onGetStarted }: LandingPageProps) {
  const [activeFeature, setActiveFeature] = useState(0)

  const currentFeatures = [
    {
      title: "Interactive Leaderboard Dashboard",
      description: "Track driver positions, lap times, and gaps with live updates and toggle between gap modes",
      icon: "🏁"
    }
  ]

  const plannedFeatures = [
    "🏎️ Live Race Replay with real-time telemetry data and interactive controls",
    "📊 Advanced Telemetry with speedometer, RPM, gear indicators, and car data visualization",
    "👻 Ghost Car Mode with 3D track visualization and lap comparison analysis",
    "⚡ Advanced Dashboard with animated speedometer, color-coded zones, lap timers, sector comparisons and delta indicators",
    "🗺️ Track Visualization with 2D/3D maps, car positions, and sector markers",
    "📈 Advanced telemetry charts with throttle/brake/gear analysis", 
    "🎮 Car HUD with speedometer, RPM bar, and gear display",
    "📱 Mobile-optimized responsive interface"
  ]

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              F1 Telemetry <span className="highlight">Viewer</span>
            </h1>
            <p className="hero-subtitle">
              Dive deep into Formula 1 race replays with advanced telemetry visualization. 
              Analyze driver performance, compare lap times, and experience races through 
              comprehensive data visualization with ghost car modes and 3D track rendering.
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary" onClick={onGetStarted}>
                Start Analyzing Replays
              </button>
              <a 
                href="https://github.com/your-username/f1-telemetry" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta-button secondary"
              >
                View on GitHub
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="f1-car">🏎️</div>
            <div className="telemetry-data">
              <div className="data-point">
                <span className="label">Speed</span>
                <span className="value">312 km/h</span>
              </div>
              <div className="data-point">
                <span className="label">Delta</span>
                <span className="value">-0.523</span>
              </div>
              <div className="data-point">
                <span className="label">Gear</span>
                <span className="value">7th</span>
              </div>
              <div className="data-point">
                <span className="label">RPM</span>
                <span className="value">11,200</span>
              </div>
              <div className="data-point">
                <span className="label">Throttle</span>
                <span className="value">98%</span>
              </div>
              <div className="data-point">
                <span className="label">Sector</span>
                <span className="value">1:23.456</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Load Replay Files</h3>
              <p>Import F1 game replay files containing comprehensive telemetry data from your races</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Analyze Performance</h3>
              <p>Use advanced visualization tools to examine lap times, telemetry, and racing lines</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Compare & Improve</h3>
              <p>Compare with ghost cars, analyze sectors, and identify areas for improvement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Current Features</h2>
          <div className="features-grid">
            {currentFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="roadmap">
        <div className="container">
          <h2>Coming Soon</h2>
          <div className="roadmap-grid">
            {plannedFeatures.map((feature, index) => (
              <div key={index} className="roadmap-item">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-text">
              <p>Built for F1 enthusiasts who want to master their racing through detailed telemetry analysis</p>
              <p>Open-source project focused on advanced replay visualization and performance insights</p>
            </div>
            <div className="footer-links">
              <a href="https://github.com/your-username/f1-telemetry" target="_blank" rel="noopener noreferrer">
                GitHub Repository
              </a>
              <a href="https://github.com/your-username/f1-telemetry/issues" target="_blank" rel="noopener noreferrer">
                Report Issues
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
