import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-lg text-center space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Waypoint <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xl text-zinc-400">
            Complete tasks. Outrun the storm.
          </p>
        </div>

        {/* Visual teaser */}
        <div className="relative h-32 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Simplified strip preview */}
          <div className="absolute inset-0 flex items-end">
            {/* Storm */}
            <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-purple-900/80 to-transparent" />
            {/* Road tiles */}
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-blue-800/40" />
            {/* Vehicle */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="w-12 h-8 bg-blue-500 rounded-t-lg rounded-b-sm shadow-lg shadow-blue-500/30" />
              <div className="flex justify-between px-0.5 -mt-0.5">
                <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full border border-zinc-600" />
                <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full border border-zinc-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 text-sm text-zinc-500">
          <p>
            Your vehicle moves forward when you complete real-world tasks.
            But the storm never stops. Fall behind, and your parent gets
            notified.
          </p>
          <p>
            Earn scrap, unlock upgrades, and open crates along the way.
            How far can you go?
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
