import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Leaderboard from './components/Leaderboard'
import LiveMode from './components/LiveMode'

function App() {
  return(
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/live" element={<LiveMode />} />
      </Routes>
    </Router>
  )
}

export default App
