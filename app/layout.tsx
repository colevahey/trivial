import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Trivial',
  description: 'Explore actor careers, discover connections, and play the six degrees game.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  Trivial
                </span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Search
                </Link>
                <Link
                  href="/six-degrees"
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Six Degrees
                </Link>
                <Link
                  href="/trivia"
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Trivia
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="border-t border-zinc-800/60 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-zinc-600">
            <span>Trivial — Powered by TMDB</span>
            <span>Data from The Movie Database</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
