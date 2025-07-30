import { Link } from "react-router-dom"
import '../styles/Navbar.css'

interface NavbarProps {
  onBackToHome?: () => void
}

function Navbar({ onBackToHome }: NavbarProps) {
  return (
    <nav>
        <div className="navbar-container">
            <button 
              onClick={onBackToHome} 
              className="home-button"
              title="Back to Home"
            >
              🏠 Home
            </button>
            <div className="nav-links">
              <Link to="/" className="link">F1 Telemetry Viewer</Link>
            </div>
        </div>
    </nav>
  )
}

export default Navbar