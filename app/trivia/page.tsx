import Link from 'next/link'

export default function TriviaLandingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
        <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h1 className="text-5xl font-black text-white mb-4">Six Degrees Trivia</h1>
      <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
        Can you connect two actors in the fewest steps? Pick films and co-stars to build the path manually. Score based on how close you get to the optimal route.
      </p>

      {/* Rules */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10 text-left">
        <h2 className="text-white font-bold text-lg mb-4">How to Play</h2>
        <div className="space-y-4">
          {[
            {
              num: '1',
              title: 'You\'re given two actors',
              desc: 'A starting actor and a target actor — your job is to connect them through shared films and co-stars.',
            },
            {
              num: '2',
              title: 'Pick a film, then a co-star',
              desc: 'From the current actor\'s filmography, pick a film they appeared in. Then choose a co-star from that film to advance the chain.',
            },
            {
              num: '3',
              title: 'Reach the target',
              desc: 'Keep picking until you arrive at the target actor. The target will be highlighted in the cast grid once they share a film with you.',
            },
            {
              num: '4',
              title: 'Score: 1000 − 100 × extra steps',
              desc: 'Your score starts at 1000 and decreases by 100 for each step beyond the optimal path. Perfect play scores 1000!',
            },
          ].map(rule => (
            <div key={rule.num} className="flex gap-4">
              <div className="w-7 h-7 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0 mt-0.5">
                {rule.num}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{rule.title}</div>
                <div className="text-zinc-500 text-sm mt-0.5 leading-relaxed">{rule.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[
          { label: 'Perfect', score: '1000', desc: 'Optimal path', color: 'text-amber-400' },
          { label: 'Good', score: '700+', desc: '3 extra steps', color: 'text-emerald-400' },
          { label: 'Any finish', score: '>0', desc: 'Just get there', color: 'text-zinc-400' },
        ].map(tier => (
          <div key={tier.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`text-2xl font-black mb-1 ${tier.color}`}>{tier.score}</div>
            <div className="text-white text-sm font-medium">{tier.label}</div>
            <div className="text-zinc-500 text-xs">{tier.desc}</div>
          </div>
        ))}
      </div>

      <Link
        href="/trivia/game"
        className="inline-flex items-center gap-3 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-black text-lg rounded-2xl transition-colors shadow-lg shadow-amber-900/30"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start Playing
      </Link>
    </div>
  )
}
