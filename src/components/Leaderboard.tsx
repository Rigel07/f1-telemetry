import { useState, useEffect, useRef } from 'react'
import Tooltip from './Tooltip'
import Tutorial from './Tutorial'
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
  gap_to_ahead: number
  penalties: number
  pit_status: number
  car_index: number
  is_player?: boolean
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
  const [showIntervalGap, setShowIntervalGap] = useState(false) // Toggle between gap to leader and interval gap
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialChecked, setTutorialChecked] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const debounceRef = useRef<number | null>(null)

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

  // Check if user has seen tutorial
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tutorial/status?user_id=default_user')
        if (response.ok) {
          const data = await response.json()
          setTutorialChecked(true)
          if (!data.has_seen_tutorial) {
            setShowTutorial(true)
          }
        } else {
          setTutorialChecked(true)
          setShowTutorial(true) // Show tutorial if can't check status
        }
      } catch (err) {
        console.error('Error checking tutorial status:', err)
        setTutorialChecked(true)
        setShowTutorial(true) // Show tutorial on error
      }
    }

    checkTutorialStatus()
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
        // Don't update currentTime here to avoid conflicts with slider
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
          const newTime = prevTime + (1.0 * playbackSpeed) // 1 second steps
          if (newTime >= maxTime) {
            setIsPlaying(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return maxTime
          }
          // Update leaderboard in separate call to avoid timing conflicts
          updateLeaderboard(newTime)
          return newTime
        })
      }, 1000) // 1 second update rate
    }
  }

  // Handle time slider change - debounced
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value)
    setCurrentTime(newTime)
    
    // Pause playback when user drags slider
    if (isPlaying) {
      setIsPlaying(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      updateLeaderboard(newTime)
    }, 300)
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
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
    if (time === 0 || time < 0) return '--'
    const mins = Math.floor(time / 60)
    const secs = (time % 60).toFixed(3)
    return `${mins}:${secs.padStart(6, '0')}`
  }

  // Tutorial completion handler
  const handleTutorialComplete = () => {
    setShowTutorial(false)
  }

  // Show tutorial manually
  const showTutorialManually = () => {
    setShowTutorial(true)
  }

  return (
    <main>
      {/* Tutorial System */}
      {tutorialChecked && (
        <>
          <Tutorial 
            isVisible={showTutorial}
            onComplete={handleTutorialComplete}
          />
          
          {!showTutorial && (
            <Tooltip content="Show tutorial again">
              <button 
                className="tutorial-trigger"
                onClick={showTutorialManually}
                aria-label="Show tutorial"
              >
                💡
              </button>
            </Tooltip>
          )}
        </>
      )}

      {/* Summary Section */}
      {raceData && (
        <div className="dashboard-summary">
          <h2>🏁 F1 Telemetry Dashboard</h2>
          <div className="summary-content">
            <p>
              <strong>Session Types:</strong> This dashboard supports multiple F1 session formats including 
              <strong> Race</strong> (full grand prix), <strong> Qualifying</strong> (time attack for grid position),
              <strong> Time Trial</strong> (single lap optimization), and <strong>Practice</strong> sessions.
            </p>
            <p>
              <strong>How it works:</strong> Select a replay file and use the playback controls to scrub through the session timeline. 
              The leaderboard updates in real-time showing driver positions, lap times, and gaps. 
              <strong> Note:</strong> Lap times appear only after drivers complete their first full lap!
            </p>
            <div className="column-guide">
              <strong>Column Guide:</strong>
              <span><strong>POS:</strong> Current race position</span>
              <span><strong>DRIVER:</strong> Driver name and team</span>
              <span><strong>LAP:</strong> Current lap number</span>
              <span><strong>LAST LAP:</strong> Most recent lap time</span>
              <span><strong>BEST LAP:</strong> Fastest lap in session</span>
              <span><strong>GAP/INTERVAL:</strong> Time behind leader or car ahead</span>
            </div>
          </div>
        </div>
      )}

      <Tooltip content="Choose a replay file to analyze">
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
      </Tooltip>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading replay data...</div>}

      {raceData && liveLeaderboard && (
        <>
          <div className="playback-controls">
            <Tooltip content={isPlaying ? "Pause the replay" : "Start playing the replay"}>
              <button onClick={togglePlayback} className="play-button">
                {isPlaying ? '⏸️' : '▶️'} {isPlaying ? 'Pause' : 'Play'}
              </button>
            </Tooltip>
            
            <div className="time-controls">
              <span>{formatTime(currentTime)}</span>
              <Tooltip content="Scrub through the session timeline">
                <input
                  type="range"
                  min="10"
                  max={maxTime}
                  step="1"
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="time-slider"
                />
              </Tooltip>
              <span>{formatTime(maxTime)}</span>
            </div>
            
            <div className="speed-controls">
              <label>Speed: </label>
              <Tooltip content="Adjust playback speed">
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
              </Tooltip>
            </div>
            
            <div className="gap-toggle">
              <Tooltip content={showIntervalGap ? "Show time gap to race leader" : "Show time gap to car directly ahead"}>
                <button 
                  onClick={() => setShowIntervalGap(!showIntervalGap)}
                  className="gap-toggle-button"
                >
                  {showIntervalGap ? 'Show Gap to Leader' : 'Show Interval Gap'}
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="race-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${((currentTime / maxTime) * 100).toFixed(1)}%`}}
              ></div>
            </div>
            <span className="progress-text">
              {((currentTime / maxTime) * 100).toFixed(1)}% Complete
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
              <span className="gap">{showIntervalGap ? 'INTERVAL' : 'GAP'}</span>
            </div>
            
            <div className="leaderboard-entries">
              {liveLeaderboard.leaderboard.length === 0 ? (
                <div className="no-data">No race data available for this time period</div>
              ) : (
                liveLeaderboard.leaderboard.slice(0, 20).map((entry) => (
                  <div key={entry.car_index} className={`leaderboard-entry ${entry.is_player ? 'player' : ''}`}>
                    <span className="pos">{entry.position}</span>
                    <span className="driver">
                      <span className="driver-name">{entry.driver_name}</span>
                      <span className="team-id">Team {entry.team_id}</span>
                    </span>
                    <span className="lap">{entry.current_lap}</span>
                    <span className="last-time">{formatLapTime(entry.last_lap_time)}</span>
                    <span className="best-time">{formatLapTime(entry.best_lap_time)}</span>
                    <span className="gap">
                      {entry.position === 1 ? 
                        (showIntervalGap ? 'INTERVAL' : 'LEADER') : 
                        showIntervalGap ? 
                          (entry.gap_to_ahead > 0 ? `+${entry.gap_to_ahead.toFixed(3)}` : '--') :
                          (entry.gap_to_leader > 0 ? `+${entry.gap_to_leader.toFixed(3)}` : '--')
                      }
                    </span>
                  </div>
                ))
              )}
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