import { useState, useEffect, useRef } from 'react'
import '../styles/Leaderboard.css'

interface ReplayFile {
  filename: string
  display_name: string
}

interface LiveLeaderboardEntry {
  position: number
  driver_name: string
  team_id: number
  current_lap: number
  last_lap_time: number
  best_lap_time: number
  sector1_time: number
  sector2_time: number
  gap_to_leader: number
  penalties: number
  pit_status: number
  car_index: number
}

interface LiveLeaderboardData {
  leaderboard: LiveLeaderboardEntry[]
  current_time: number
  max_time: number
  progress_percent: number
}

interface RaceData {
  session_info: {
    track_id: number
    session_type: number
    track_length: number
    weather: number
  }
  lap_data: Array<{
    timestamp: number
    session_time: number
    current_lap: number
    lap_time: number
    sector1_time: number
    sector2_time: number
    lap_distance: number
    position: number
  }>
  participants: Array<{
    index: number
    driver_id: number
    name: string
    team_id: number
    nationality: number
  }>
  telemetry: Array<{
    timestamp: number
    session_time: number
    speed: number
    gear: number
    throttle: number
    brake: number
    engine_rpm: number
  }>
  leaderboard: LiveLeaderboardEntry[]
}

function Leaderboard() {
  const [replays, setReplays] = useState<ReplayFile[]>([])
  const [selectedReplay, setSelectedReplay] = useState<string>('')
  const [raceData, setRaceData] = useState<RaceData | null>(null)
  const [liveLeaderboard, setLiveLeaderboard] = useState<LiveLeaderboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [maxTime, setMaxTime] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const intervalRef = useRef<number | null>(null)

  // Fetch available replays on component mount
  useEffect(() => {
    const fetchReplays = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/replays')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setReplays(data)
      } catch (err) {
        console.error('Error fetching replays:', err)
        setError('Failed to load replays: ' + (err as Error).message)
      }
    }

    fetchReplays()
  }, [])

  // Handle replay selection
  const handleReplayChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = event.target.value
    setSelectedReplay(filename)
    setIsPlaying(false)
    setCurrentTime(10) // Start at 10 seconds
    
    if (filename) {
      setLoading(true)
      setError('')
      
      try {
        const response = await fetch(`http://localhost:5000/api/replay/${filename}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        setRaceData(data)
        
        // Get initial leaderboard data
        const liveResponse = await fetch(`http://localhost:5000/api/replay/${filename}/live?time=10`)
        if (liveResponse.ok) {
          const liveData = await liveResponse.json()
          if (liveData.error) {
            throw new Error(liveData.error)
          }
          setLiveLeaderboard(liveData)
          setMaxTime(liveData.max_time)
          setCurrentTime(10) // Start at 10 seconds instead of 0
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading replay:', err)
        setError('Failed to load replay data: ' + (err as Error).message)
        setLoading(false)
      }
    }
  }

  // Live leaderboard update function
  const updateLeaderboard = async (time: number) => {
    if (!selectedReplay) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/replay/${selectedReplay}/live?time=${time}`)
      if (response.ok) {
        const data = await response.json()
        setLiveLeaderboard(data)
        setCurrentTime(data.current_time)
      }
    } catch (err) {
      console.error('Error updating leaderboard:', err)
    }
  }

  // Play/pause functionality
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      setIsPlaying(true)
      intervalRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + (0.1 * playbackSpeed) // Update every 100ms
          if (newTime >= maxTime) {
            setIsPlaying(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return maxTime
          }
          updateLeaderboard(newTime)
          return newTime
        })
      }, 100)
    }
  }

  // Handle time slider change
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value)
    setCurrentTime(newTime)
    updateLeaderboard(newTime)
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, '0')}`
  }

  // Format lap time helper
  const formatLapTime = (time: number): string => {
    if (time === 0) return '--'
    const mins = Math.floor(time / 60)
    const secs = (time % 60).toFixed(3)
    return `${mins}:${secs.padStart(6, '0')}`
  }

  return (
    <main>
      <select 
        name="replay-list" 
        id="replay-list" 
        value={selectedReplay}
        onChange={handleReplayChange}
      >
        <option value="" disabled>Select a replay</option>
        {replays.map(replay => (
          <option key={replay.filename} value={replay.filename}>
            {replay.display_name}
          </option>
        ))}
      </select>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading replay data...</div>}

      {raceData && liveLeaderboard && (
        <>
          <div className="playback-controls">
            <button onClick={togglePlayback} className="play-button">
              {isPlaying ? '⏸️' : '▶️'} {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <div className="time-controls">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={maxTime}
                step="0.1"
                value={currentTime}
                onChange={handleTimeChange}
                className="time-slider"
              />
              <span>{formatTime(maxTime)}</span>
            </div>
            
            <div className="speed-controls">
              <label>Speed: </label>
              <select 
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="speed-select"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
              </select>
            </div>
          </div>

          <div className="race-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${liveLeaderboard.progress_percent}%`}}
              ></div>
            </div>
            <span className="progress-text">
              {liveLeaderboard.progress_percent.toFixed(1)}% Complete
            </span>
          </div>

          <div className="leaderboard">
            <h2>🏁 Live Race Leaderboard</h2>
            <div className="leaderboard-header">
              <span className="pos">POS</span>
              <span className="driver">DRIVER</span>
              <span className="lap">LAP</span>
              <span className="last-time">LAST LAP</span>
              <span className="best-time">BEST LAP</span>
              <span className="gap">GAP</span>
            </div>
            
            <div className="leaderboard-entries">
              {liveLeaderboard.leaderboard.slice(0, 20).map((entry) => (
                <div key={entry.car_index} className={`leaderboard-entry ${entry.position === 1 ? 'leader' : ''}`}>
                  <span className="pos">{entry.position}</span>
                  <span className="driver">
                    <span className="driver-name">{entry.driver_name}</span>
                    <span className="team-id">Team {entry.team_id}</span>
                  </span>
                  <span className="lap">{entry.current_lap}</span>
                  <span className="last-time">{formatLapTime(entry.last_lap_time)}</span>
                  <span className="best-time">{formatLapTime(entry.best_lap_time)}</span>
                  <span className="gap">
                    {entry.position === 1 ? 'LEADER' : 
                     entry.gap_to_leader > 0 ? `+${entry.gap_to_leader.toFixed(3)}` : '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="session-info">
            <h3>Session Information</h3>
            <p>Track ID: {raceData.session_info.track_id}</p>
            <p>Session Type: {raceData.session_info.session_type}</p>
            <p>Weather: {raceData.session_info.weather}</p>
            <p>Current Time: {formatTime(currentTime)}</p>
          </div>
        </>
      )}
    </main>
  )
}

export default Leaderboard