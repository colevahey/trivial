import Link from 'next/link'

export const metadata = { title: 'About — Trivial' }

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-white mb-2">About Trivial</h1>
      <p className="text-zinc-500 text-sm mb-12">A film and actor exploration tool powered by The Movie Database.</p>

      <div className="space-y-10">

        <section>
          <h2 className="text-lg font-bold text-white mb-4">What you can do</h2>
          <div className="space-y-3">
            {[
              {
                href: '/actor/287',
                name: 'Career Mapper',
                desc: "Pick any actor and explore their filmography through five lenses: a scatter timeline of rating vs. year, a genre radar, box office charts, a D3 force-directed co-star network, and a browsable credits grid.",
              },
              {
                href: '/six-degrees',
                name: 'Six Degrees',
                desc: 'Enter any two actors and instantly find the shortest chain of shared films connecting them — bidirectional BFS, max four hops.',
              },
              {
                href: '/trivia/game',
                name: 'Movie Path Game',
                desc: 'The Six Degrees puzzle in reverse: you build the path manually, picking films and co-stars one step at a time. Score is based on how close you get to the optimal route.',
              },
              {
                href: '/trivia/actor',
                name: 'Career Quiz',
                desc: "Answer five questions about an actor's career — top-grossing film, debut year, average rating, and more. Scored by accuracy, not just right/wrong.",
              },
              {
                href: '/watchlist',
                name: 'Watchlist',
                desc: 'Bookmark any movie from cards or detail pages. Saved locally to your device — no account needed.',
              },
            ].map(f => (
              <div key={f.href} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <Link href={f.href} className="text-amber-400 hover:text-amber-300 font-semibold text-sm transition-colors">
                  {f.name} →
                </Link>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">Data</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            All film and actor data comes from{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              The Movie Database (TMDB)
            </a>
            . Trivial is not endorsed by or affiliated with TMDB.
          </p>
        </section>

      </div>
    </div>
  )
}
