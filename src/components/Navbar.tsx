import { Link } from "react-router-dom"
import '../styles/Navbar.css'

function Navbar() {
  return (
    <nav>
        <div className="navbar-container">
            <Link to="/" className="link">Replay Mode</Link>
            <Link to="/live" className="link">Live Mode</Link>
        </div>
    </nav>
  )
}

export default Navbar