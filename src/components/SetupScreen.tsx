import { useState } from 'react'
import { ArrowRight, Train, Clock, MapPin, Plus, Minus } from 'lucide-react'
import { StationSelector } from './StationSelector'
import { StationPickerMap, type PickMode } from './StationPickerMap'
import { UK_STATIONS } from '../data/ukStations'
import type { Journey, Station } from '../types/station'
import {
  estimateJourneyMinutes,
  formatMinutes,
  haversineDistanceKm,
  nearestStationByMinutes,
  nearestStationsByMinutes,
} from '../utils/journey'

interface SetupScreenProps {
  onStart: (journey: Journey) => void
}

const MIN_DURATION = 3
const MAX_DURATION = 180
const DURATION_STEP = 1
const DURATION_PRESETS = [15, 25, 45, 60, 90, 120]

const INITIAL_FROM = UK_STATIONS.find((s) => s.crs === 'PAD') ?? UK_STATIONS[0]
const INITIAL_DURATION = 45

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [from, setFrom] = useState<Station | null>(INITIAL_FROM)
  // Focus duration is the source of truth — it drives which station we head to.
  const [durationMinutes, setDurationMinutes] = useState(INITIAL_DURATION)
  const [to, setTo] = useState<Station | null>(() =>
    nearestStationByMinutes(INITIAL_FROM, INITIAL_DURATION, UK_STATIONS),
  )
  const [pickMode, setPickMode] = useState<PickMode>('from')

  const sameStation = from && to && from.crs === to.crs
  const hasRoute = from && to && !sameStation
  const estimated = hasRoute ? estimateJourneyMinutes(from, to) : null
  const distance = hasRoute ? haversineDistanceKm(from, to) : null

  const canStart = Boolean(hasRoute && durationMinutes > 0)

  // Candidate arrivals near the chosen focus time — the user can swap between
  // them without changing the duration they picked.
  const arrivalOptions = from
    ? nearestStationsByMinutes(from, durationMinutes, UK_STATIONS, 4)
    : []

  // The user picks an amount of minutes; we snap the destination to the station
  // whose rail journey best matches that time.
  function handleDurationChange(mins: number) {
    setDurationMinutes(mins)
    if (from) {
      const next = nearestStationByMinutes(from, mins, UK_STATIONS)
      if (next) setTo(next)
    }
  }

  // Changing the origin keeps the chosen focus time and re-targets the destination.
  function selectFrom(station: Station) {
    setFrom(station)
    const next = nearestStationByMinutes(station, durationMinutes, UK_STATIONS)
    if (next) setTo(next)
  }

  // Manually choosing a destination syncs the focus time to that route.
  function selectTo(station: Station) {
    setTo(station)
    if (from) setDurationMinutes(estimateJourneyMinutes(from, station))
  }

  function handleMapSelect(station: Station) {
    if (pickMode === 'from') {
      if (station.crs === to?.crs) return
      selectFrom(station)
      setPickMode('to')
    } else {
      if (station.crs === from?.crs) return
      selectTo(station)
    }
  }

  function handleStart() {
    if (!canStart || !from || !to) return
    onStart({ from, to, durationMinutes })
  }

  return (
    <div className="flex h-full min-h-full flex-col lg:flex-row">
      {/* Interactive map */}
      <div className="relative h-[42vh] min-h-[260px] lg:h-full lg:min-h-0 lg:flex-1">
        <StationPickerMap
          from={from}
          to={to}
          pickMode={pickMode}
          onSelect={handleMapSelect}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-rail-navy/90 via-rail-navy/40 to-transparent p-4 lg:p-5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickMode('from')}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                pickMode === 'from'
                  ? 'border-rail-accent bg-rail-accent/20 text-rail-cream'
                  : 'border-white/10 bg-rail-navy/70 text-rail-muted hover:text-rail-cream'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rail-accent" />
              Pick departure
            </button>
            <button
              type="button"
              onClick={() => setPickMode('to')}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                pickMode === 'to'
                  ? 'border-rail-track bg-rail-track/20 text-rail-cream'
                  : 'border-white/10 bg-rail-navy/70 text-rail-muted hover:text-rail-cream'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rail-track" />
              Pick arrival
            </button>
          </div>
          <p className="pointer-events-none mt-2 text-xs text-rail-muted">
            <MapPin className="mr-1 inline h-3 w-3" />
            Tap any station, or set a focus time below to auto-pick your arrival
          </p>
        </div>
      </div>

      {/* Setup panel */}
      <div className="w-full overflow-y-auto border-t border-white/10 bg-rail-navy lg:w-[420px] lg:border-t-0 lg:border-l">
        <div className="px-5 py-8 sm:px-8">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rail-accent/30 bg-rail-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rail-accent-light">
              <Train className="h-3 w-3" />
              National Rail · UK
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-rail-cream">
              Relaxed Transit
            </h1>
            <p className="mt-2 text-sm text-rail-muted">
              Choose your route on the map or search below, then board when ready.
            </p>
          </div>

          <div className="space-y-4">
            <StationSelector
              label="Departing from"
              value={from}
              onOpen={() => setPickMode('from')}
              onChange={(s) => {
                selectFrom(s)
                setPickMode('to')
              }}
              exclude={to}
            />

            <StationSelector
              label="Arriving at"
              value={to}
              onOpen={() => setPickMode('to')}
              onChange={(s) => selectTo(s)}
              exclude={from}
            />
          </div>

          {sameStation && (
            <p className="mt-4 text-sm text-rail-track">Choose two different stations.</p>
          )}

          {hasRoute && estimated !== null && distance !== null && (
            <div className="mt-6 rounded-xl border border-white/10 bg-rail-deep/60 p-4">
              <label
                htmlFor="focus-duration"
                className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-rail-muted"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Focus duration
                </span>
                <span className="text-base font-bold normal-case tracking-normal text-rail-accent-light">
                  {formatMinutes(durationMinutes)}
                </span>
              </label>

              <input
                id="focus-duration"
                type="range"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={DURATION_STEP}
                value={durationMinutes}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-rail-accent"
              />
              <div className="mt-1 flex justify-between text-[10px] text-rail-muted/70">
                <span>{MIN_DURATION} min</span>
                <span>{formatMinutes(MAX_DURATION)}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDurationChange(Math.max(MIN_DURATION, durationMinutes - DURATION_STEP))
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-rail-muted transition hover:border-rail-accent/40 hover:text-rail-cream"
                  aria-label="Decrease focus duration"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex flex-1 flex-wrap gap-2">
                  {DURATION_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationChange(mins)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                        durationMinutes === mins
                          ? 'bg-rail-accent text-white'
                          : 'border border-white/10 text-rail-muted hover:border-rail-accent/40 hover:text-rail-cream'
                      }`}
                    >
                      {formatMinutes(mins)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDurationChange(Math.min(MAX_DURATION, durationMinutes + DURATION_STEP))
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-rail-muted transition hover:border-rail-accent/40 hover:text-rail-cream"
                  aria-label="Increase focus duration"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-rail-muted">
                  Arrival station
                  <span className="ml-1 font-normal normal-case tracking-normal text-rail-muted/70">
                    · nearest to {formatMinutes(durationMinutes)}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {arrivalOptions.map((station) => {
                    const railTime = estimateJourneyMinutes(from, station)
                    const km = Math.round(haversineDistanceKm(from, station))
                    const active = to?.crs === station.crs
                    return (
                      <button
                        key={station.crs}
                        type="button"
                        onClick={() => setTo(station)}
                        className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? 'border-rail-accent bg-rail-accent/15 text-rail-cream'
                            : 'border-white/10 text-rail-muted hover:border-rail-accent/40 hover:text-rail-cream'
                        }`}
                      >
                        <span className="w-full truncate text-sm font-medium">{station.name}</span>
                        <span className="text-xs text-rail-muted">
                          {formatMinutes(railTime)} · {km} km
                        </span>
                      </button>
                    )
                  })}
                </div>
                {to && !arrivalOptions.some((s) => s.crs === to.crs) && (
                  <p className="mt-2 text-xs text-rail-muted">
                    Heading to <span className="text-rail-cream">{to.name}</span> ·{' '}
                    {formatMinutes(estimated)} · {Math.round(distance)} km
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-rail-accent py-4 text-base font-semibold text-white transition hover:bg-rail-accent-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Board train
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-4 text-center text-xs text-rail-muted/70">
            Distances and times are estimated from station coordinates.
          </p>
        </div>
      </div>
    </div>
  )
}
