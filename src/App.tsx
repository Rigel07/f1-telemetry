import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import Leaderboard from './components/Leaderboard'

function App() {
  const [showLanding, setShowLanding] = useState(true)

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />
  }

  return (
    <Router>
      <Navbar onBackToHome={() => setShowLanding(true)} />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
      </Routes>
    </Router>
  )
}

export default App
