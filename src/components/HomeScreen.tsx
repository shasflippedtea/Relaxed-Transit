import { ArrowRight, Train } from 'lucide-react'

interface HomeScreenProps {
  onGetStarted: () => void
}

/**
 * Landing / home page. This is intentionally a light scaffold — build it out
 * (hero, features, recent journeys, etc.) however you like.
 */
export function HomeScreen({ onGetStarted }: HomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
 
      <h1 className="font-display text-4xl font-bold tracking-tight text-rail-cream sm:text-6xl">
        Welcome to Relaxed Transit
      </h1>

      <p className="mt-4 max-w-md text-sm text-rail-muted ">
        Turn your study time into a train journey. Pick a route, board, and focus
        until you arrive.
      </p>

      <p className="mt-4 max-w-md text-sm text-rail-d sm:text-base">
        What will you be focusing on today? Studying or Mediating? The choice is yours!
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onGetStarted}
          className="flex items-center justify-center gap-2 rounded-xl bg-rail-accent px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rail-accent-light"
        >
          Study train
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => {onGetStarted()}}
          className="flex items-center justify-center gap-2 rounded-xl bg-rail-accent px-6 py-3.5 text-base font-semibold text-white transition hover:bg-rail-accent-light"
        >
          Meditation train
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* TODO: add more home-page sections here */}
    </div>
  )
}
