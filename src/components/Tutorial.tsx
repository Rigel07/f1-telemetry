import { useState } from 'react'
import '../styles/Tutorial.css'

interface TutorialProps {
  onComplete: () => void
  isVisible: boolean
}

function Tutorial({ onComplete, isVisible }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to F1 Telemetry Viewer!',
      content: `This dashboard shows F1 race replay data. You can analyze different types of sessions:
        
        • Race Sessions: Full grand prix races with multiple laps
        • Qualifying: Time attack sessions for grid position
        • Time Trial: Single lap optimization runs
        • Practice: Free practice session data
        
        Select a replay file from the dropdown to begin analysis.`
    },
    {
      id: 'leaderboard',
      title: 'Understanding the Leaderboard',
      content: `The leaderboard shows real-time race positions with several columns:
        
        • Position: Current race position (1st, 2nd, etc.)
        • Driver: Driver name from the F1 game
        • Gap to Leader: Time difference from race leader
        • Gap to Ahead: Time difference from car directly ahead
        • Current Lap: Which lap number the driver is on
        • Last Lap: Their most recent completed lap time
        • Best Lap: Their fastest lap time in the session
        
        Note: Lap times won't appear until drivers complete at least one full lap!`
    },
    {
      id: 'controls',
      title: 'Interactive Controls',
      content: `Use these controls to navigate the replay:

        • Time Slider: Scrub through the session timeline
        • Gap Toggle: Switch between "Gap to Leader" and "Gap to Ahead" modes
        • Replay Selector: Choose different replay files to analyze
        • Progress Bar: Shows current position in the session

        Hover over buttons and elements for additional tooltips!`
    }
  ]

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTutorial = async () => {
    try {
      // Mark tutorial as completed on backend
      await fetch('/api/tutorial/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: 'default_user' })
      })
    } catch (error) {
      console.error('Failed to save tutorial completion:', error)
    }
    
    onComplete()
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  if (!isVisible) return null

  const currentTutorialStep = tutorialSteps[currentStep]

  return (
    <div className="tutorial-overlay">
      <div className={`tutorial-container ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="tutorial-header">
          <h3>{currentTutorialStep.title}</h3>
          <div className="tutorial-controls">
            <button 
              className="collapse-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand tutorial" : "Collapse tutorial"}
            >
              {isCollapsed ? '📖' : '📕'}
            </button>
            <button 
              className="skip-btn"
              onClick={skipTutorial}
              title="Skip tutorial"
            >
              ✕
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            <div className="tutorial-content">
              <div className="step-indicator">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
              <div className="tutorial-text">
                {currentTutorialStep.content.split('\n').map((line, index) => {
                  if (line.trim().startsWith('•')) {
                    return <li key={index} className="tutorial-bullet">{line.substring(1).trim()}</li>
                  } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                    return <h4 key={index} className="tutorial-subheading">{line.replace(/\*\*/g, '')}</h4>
                  } else if (line.trim()) {
                    return <p key={index}>{line}</p>
                  }
                  return <br key={index} />
                })}
              </div>
            </div>
            
            <div className="tutorial-navigation">
              <button 
                className="tutorial-btn prev"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </button>
              
              <div className="tutorial-progress">
                {tutorialSteps.map((_, index) => (
                  <div 
                    key={index}
                    className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  />
                ))}
              </div>
              
              <button 
                className="tutorial-btn next"
                onClick={nextStep}
              >
                {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Tutorial
