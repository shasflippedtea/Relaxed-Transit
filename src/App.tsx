import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { SetupScreen } from './components/SetupScreen'
import { FocusSession } from './components/FocusSession'
import type { Journey } from './types/station'

type Screen = 'home' | 'setup' | 'session'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [journey, setJourney] = useState<Journey | null>(null)

  function handleStart(j: Journey) {
    setJourney(j)
    setScreen('session')
  }

  function handleEnd() {
    setJourney(null)
    setScreen('setup')
  }

  return (
    <div className="h-full bg-rail-navy">
      {screen === 'home' && <HomeScreen onGetStarted={() => setScreen('setup')} />}
      {screen === 'setup' && <SetupScreen onStart={handleStart} />}
      {screen === 'session' && journey && (
        <FocusSession journey={journey} onEnd={handleEnd} />
      )}
    </div>
  )
}

export default App
