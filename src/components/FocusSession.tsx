import { useCallback, useEffect, useState, useRef } from 'react'
import { Pause, Play, RotateCcw, Square } from 'lucide-react'
import { JourneyMap } from './JourneyMap'
import { TrainSprite, BulletTrainIcon } from './TrainSprite'
import type { Journey, SessionStatus } from '../types/station'
import { formatDuration } from '../utils/journey'
import completedSoundUrl from '../assets/completedsound.mp3'

interface FocusSessionProps {
  journey: Journey
  onEnd: () => void
}

export function FocusSession({ journey, onEnd }: FocusSessionProps) {
  const totalSeconds = journey.durationMinutes * 60
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState<SessionStatus>('running')

  const remaining = Math.max(0, totalSeconds - elapsed)
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0

  const completeSound = useRef<HTMLAudioElement | null>(null)
  if (!completeSound.current) {
    completeSound.current = new Audio(completedSoundUrl)
  }

  // Play the arrival chime once the journey completes.
  useEffect(() => {
    if (status !== 'complete') return
    const audio = completeSound.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {
      /* autoplay may be blocked until the user interacts — safe to ignore */
    })
  }, [status])

  useEffect(() => {
    if (status !== 'running') return

    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= totalSeconds) {
          setStatus('complete')
          return totalSeconds
        }
        return e + 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [status, totalSeconds])

  const togglePause = useCallback(() => {
    setStatus((s) => (s === 'running' ? 'paused' : s === 'paused' ? 'running' : s))
  }, [])

  const reset = useCallback(() => {
    setElapsed(0)
    setStatus('running')
  }, [])

  const { from, to } = journey

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Map panel */}
      <div className="relative h-[45vh] min-h-[280px] flex-1 lg:h-full lg:min-h-0">
        <JourneyMap from={from} to={to} progress={progress} />

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-rail-navy/80 to-transparent p-4 lg:p-6">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-rail-navy/70 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            <BulletTrainIcon className="h-3 w-9" />
            {status === 'running' && 'In transit'}
            {status === 'paused' && 'Paused at station'}
            {status === 'complete' && 'Arrived'}
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex w-full flex-col border-t border-white/10 bg-rail-deep lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="flex flex-1 flex-col p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-rail-muted">
              Your journey
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-rail-cream">
              {from.name.split(' ').slice(-2).join(' ')} → {to.name.split(' ').slice(-2).join(' ')}
            </h2>
            <p className="mt-1 text-sm text-rail-muted">
              {from.crs} to {to.crs}
            </p>
          </div>

          {/* Progress track */}
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-rail-muted">
              <span>{from.crs}</span>
              <span>{Math.round(progress * 100)}%</span>
              <span>{to.crs}</span>
            </div>
            <div className="relative h-5">
              <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-rail-panel progress-track">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0d6b52]/80 to-[#5cb8a4] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${Math.max(progress * 100, 0)}%` }}
                />
              </div>
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000 ease-linear"
                style={{ left: `${progress * 100}%` }}
              >
                <TrainSprite className="h-4 w-12" />
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-rail-panel/50 px-3 py-1.5">
              <BulletTrainIcon className="h-3.5 w-10" />
              <span className="text-xs font-medium text-rail-muted">
                {status === 'running' && 'In transit'}
                {status === 'paused' && 'Paused at station'}
                {status === 'complete' && 'Arrived at destination'}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-rail-muted">
              {status === 'complete' ? 'Journey complete' : 'Time remaining'}
            </p>
            <p className="font-timer mt-2 text-[4.5rem] font-semibold leading-none text-rail-cream sm:text-7xl">
              {status === 'complete' ? '00:00' : formatDuration(remaining)}
            </p>
            <p className="mt-2 text-sm text-rail-muted">
              {formatDuration(elapsed)} elapsed · {journey.durationMinutes} min total
            </p>
          </div>

          {/* Status message */}
          <div className="mb-8 rounded-xl border border-white/10 bg-rail-panel/40 p-4 text-center text-sm text-rail-muted">
            {status === 'running' && (
              <>Sit back. The train is moving — focus until you reach {to.name}.</>
            )}
            {status === 'paused' && <>Journey paused. Resume when you&apos;re ready.</>}
            {status === 'complete' && (
              <>
                Welcome to <span className="font-medium text-rail-cream">{to.name}</span>.
                Well done on your focus session.
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-auto flex gap-3">
            {status !== 'complete' ? (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3.5 font-semibold transition hover:border-rail-accent/40 hover:bg-rail-panel"
                >
                  {status === 'paused' ? (
                    <>
                      <Play className="h-4 w-4" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" /> Pause
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3.5 transition hover:border-rail-track/50 hover:text-rail-track"
                  aria-label="End session"
                >
                  <Square className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3.5 font-semibold transition hover:border-rail-accent/40"
                >
                  <RotateCcw className="h-4 w-4" /> Again
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rail-accent py-3.5 font-semibold text-white transition hover:bg-rail-accent-light"
                >
                  New route
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
