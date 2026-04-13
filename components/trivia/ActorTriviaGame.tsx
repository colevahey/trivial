'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'

interface Film {
  id: number
  title: string
  year: number
  vote_average: number
  revenue: number
}

export interface ActorTriviaData {
  actor: { id: number; name: string; profile_path: string | null }
  films: Film[]
  filmCount: number
  highestGrossing: Film[]
  highestRated: Film[]
  firstFilm: Film | null
  totalRevenue: number
  criticalCount: number
  revenueFilmCount: number
}

// ── Scoring & Formatting ─────────────────────────────────────────────────────

function scoreRank(film: Film | null, ranked: Film[]): number {
  if (!film) return 0
  const rank = ranked.findIndex(m => m.id === film.id) + 1
  if (rank === 0) return 0
  return Math.max(0, Math.round(((ranked.length - rank + 1) / ranked.length) * 20))
}

function scoreYear(guess: string, answer: number): number {
  const y = parseInt(guess)
  if (isNaN(y)) return 0
  return Math.max(0, Math.round(20 - Math.abs(y - answer) * 2))
}

function scoreRevenue(guess: string, answer: number): number {
  const n = parseInt(guess)
  if (isNaN(n) || answer === 0) return 0
  return Math.max(0, Math.round((1 - Math.abs(n - answer) / answer) * 20))
}

function scoreCount(guess: string, answer: number): number {
  const n = parseInt(guess)
  if (isNaN(n) || answer === 0) return 0
  return Math.max(0, Math.round((1 - Math.abs(n - answer) / answer) * 20))
}

function formatRevenue(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000).toLocaleString()}M`
  return `$${n.toLocaleString()}`
}

function cardStyle(score: number): string {
  if (score === 20) return 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/40'
  if (score >= 16) return 'bg-gradient-to-r from-zinc-300/10 to-transparent border-zinc-400/30'
  if (score >= 12) return 'bg-gradient-to-r from-amber-800/25 to-transparent border-amber-700/30'
  return 'bg-zinc-900/80 border-zinc-800'
}

function medalEmoji(score: number): string {
  if (score === 20) return '🥇'
  if (score >= 16) return '🥈'
  if (score >= 12) return '🥉'
  return ''
}

// ── Film Search ──────────────────────────────────────────────────────────────

function FilmSearch({ films, value, onChange, disabled, onAutoSubmit }: {
  films: Film[]
  value: Film | null
  onChange: (f: Film | null) => void
  disabled: boolean
  onAutoSubmit?: () => void
}) {
  const [query, setQuery] = useState(value?.title ?? '')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)

  const filtered = query.length >= 1
    ? films.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  function pick(film: Film) {
    onChange(film)
    setQuery(film.title)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); onChange(null); setOpen(true); setHi(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
          if (e.key === 'Enter') {
            if (filtered[hi]) {
              pick(filtered[hi])
              setTimeout(() => onAutoSubmit?.(), 100)
            }
          }
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Type a film title..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
          {filtered.map((film, i) => (
            <button
              key={film.id}
              className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center gap-2 ${
                i === hi ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
              onMouseDown={() => pick(film)}
              onMouseEnter={() => setHi(i)}
            >
              <span>{film.title}</span>
              <span className="text-zinc-500 flex-shrink-0">{film.year}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Top 5 list ───────────────────────────────────────────────────────────────

function Top5Films({ films, picked, statKey }: {
  films: Film[]
  picked: Film | null
  statKey: 'revenue' | 'vote_average'
}) {
  return (
    <div className="space-y-1 mt-3">
      {films.map((film, i) => (
        <div key={film.id} className={`flex justify-between items-center text-xs rounded px-2 py-1.5 ${
          picked?.id === film.id ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-zinc-800/40'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-500 w-3 flex-shrink-0">{i + 1}</span>
            <span className="text-zinc-200 truncate text-xs">{film.title}</span>
            <span className="text-zinc-500 text-xs flex-shrink-0">{film.year}</span>
          </div>
          <span className="text-amber-400 text-xs font-medium flex-shrink-0 ml-2">
            {statKey === 'revenue' ? formatRevenue(film.revenue) : `★ ${film.vote_average.toFixed(1)}`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

type Answer = Film | string | null

export function ActorTriviaGame({ data }: { data: ActorTriviaData }) {
  const { actor, films, filmCount, highestGrossing, highestRated, firstFilm, totalRevenue, criticalCount, revenueFilmCount } = data

  const byRevenue = [...films].filter(m => m.revenue > 0).sort((a, b) => b.revenue - a.revenue)
  const byRating = [...films].sort((a, b) => b.vote_average - a.vote_average)

  // ── Questions ────────────────────────────────────────────────────────────
  const allQuestions: Array<{
    key: string
    label: string
    question: string
    hint: string
    available: boolean
    input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) => React.ReactNode
    score: (val: Answer) => number
    rankSummary: (val: Answer) => string
    answerLabel: (val: Answer) => string
    reveal: (val: Answer) => React.ReactNode
  }> = [
    {
      key: 'highestGrossing' as const,
      label: 'Highest-Grossing Film',
      question: `What is ${actor.name}'s highest-grossing film?`,
      hint: `Based on ${byRevenue.length} films with box office data`,
      available: byRevenue.length >= 3,
      input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) =>
        <FilmSearch films={byRevenue} value={val as Film | null} onChange={onChange} disabled={disabled} onAutoSubmit={onAutoSubmit} />,
      score: (val: Answer) => scoreRank(val as Film | null, byRevenue),
      rankSummary: (val: Answer) => {
        const film = val as Film | null
        if (!film) return '—'
        const rank = byRevenue.findIndex(m => m.id === film.id) + 1
        if (rank === 0) return 'Not in top films'
        if (rank === 1) return 'Highest-grossing film'
        if (rank === 2) return '2nd highest-grossing'
        return `${rank}th highest-grossing`
      },
      answerLabel: (val: Answer) => {
        const film = val as Film | null
        return film ? film.title.substring(0, 25) : '—'
      },
      reveal: (val: Answer) => <Top5Films films={highestGrossing} picked={val as Film | null} statKey="revenue" />,
    },
    {
      key: 'firstFilmYear' as const,
      label: 'Career Debut',
      question: `What year did ${actor.name} make their first film?`,
      hint: '±2 years = strong · 2 points per year off',
      available: firstFilm !== null,
      input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            const y = parseInt(e.currentTarget.value)
            if (!isNaN(y) && y >= 1900 && y <= 2030) {
              onAutoSubmit?.()
            }
          }
        }
        return (
          <input type="number" min="1900" max="2030" value={(val as string) ?? ''} disabled={disabled}
            onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. 1987"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
        )
      },
      score: (val: Answer) => firstFilm ? scoreYear(val as string, firstFilm.year) : 0,
      rankSummary: (val: Answer) => {
        if (!firstFilm) return '—'
        const y = parseInt(val as string)
        if (isNaN(y)) return '—'
        const diff = Math.abs(y - firstFilm.year)
        if (diff === 0) return 'Exact!'
        return `${diff} year${diff === 1 ? '' : 's'} off`
      },
      answerLabel: (val: Answer) => (val as string) || '—',
      reveal: (_val: Answer) => firstFilm ? (
        <div className="mt-3 text-sm bg-zinc-800/40 rounded px-2 py-2">
          <span className="text-amber-400 font-bold">{firstFilm.year}</span>
          <span className="text-zinc-400 ml-2">{firstFilm.title}</span>
        </div>
      ) : null,
    },
    {
      key: 'highestRated' as const,
      label: 'Highest-Rated Film',
      question: `What is ${actor.name}'s highest-rated film?`,
      hint: 'By TMDB user rating',
      available: byRating.length >= 3,
      input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) =>
        <FilmSearch films={byRating} value={val as Film | null} onChange={onChange} disabled={disabled} onAutoSubmit={onAutoSubmit} />,
      score: (val: Answer) => scoreRank(val as Film | null, byRating),
      rankSummary: (val: Answer) => {
        const film = val as Film | null
        if (!film) return '—'
        const rank = byRating.findIndex(m => m.id === film.id) + 1
        if (rank === 0) return 'Not in top films'
        if (rank === 1) return 'Highest-rated film'
        if (rank === 2) return '2nd highest-rated'
        return `${rank}th highest-rated`
      },
      answerLabel: (val: Answer) => {
        const film = val as Film | null
        return film ? film.title.substring(0, 25) : '—'
      },
      reveal: (val: Answer) => <Top5Films films={highestRated} picked={val as Film | null} statKey="vote_average" />,
    },
    {
      key: 'criticalCount' as const,
      label: 'Critically Acclaimed',
      question: `How many of ${actor.name}'s films have a TMDB rating of 7.0 or above?`,
      hint: 'Enter a number',
      available: films.length >= 3,
      input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            const n = parseInt(e.currentTarget.value)
            if (!isNaN(n) && n >= 0) {
              onAutoSubmit?.()
            }
          }
        }
        return (
          <input type="number" min="0" value={(val as string) ?? ''} disabled={disabled}
            onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder="Number of films..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
        )
      },
      score: (val: Answer) => scoreCount(val as string, criticalCount),
      rankSummary: (val: Answer) => {
        const n = parseInt(val as string)
        if (isNaN(n)) return '—'
        const diff = Math.abs(n - criticalCount)
        if (diff === 0) return 'Exact!'
        return `Off by ${diff}`
      },
      answerLabel: (val: Answer) => (val as string) ? `${parseInt(val as string).toLocaleString()} films` : '—',
      reveal: (_val: Answer) => (
        <div className="mt-3 text-sm bg-zinc-800/40 rounded px-2 py-2">
          <span className="text-amber-400 font-bold">{criticalCount}</span>
          <span className="text-zinc-400 ml-2">films rated 7.0+</span>
        </div>
      ),
    },
    {
      key: 'totalRevenue' as const,
      label: 'Total Box Office',
      question: `What is ${actor.name}'s combined box office total?`,
      hint: `Based on ${revenueFilmCount} films · enter in dollars`,
      available: byRevenue.length >= 3,
      input: (val: Answer, onChange: (v: Answer) => void, disabled: boolean, onAutoSubmit?: () => void) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            const n = parseInt(e.currentTarget.value)
            if (!isNaN(n) && n > 0) {
              onAutoSubmit?.()
            }
          }
        }
        return (
          <input type="number" min="0" value={(val as string) ?? ''} disabled={disabled}
            onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder="Total in dollars..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed" />
        )
      },
      score: (val: Answer) => scoreRevenue(val as string, totalRevenue),
      rankSummary: (val: Answer) => {
        const n = parseInt(val as string)
        if (isNaN(n)) return '—'
        const pct = Math.round(Math.abs(n - totalRevenue) / totalRevenue * 100)
        if (pct === 0) return 'Exact!'
        if (pct < 5) return `Within ${pct}%`
        return `Off by ${pct}%`
      },
      answerLabel: (val: Answer) => (val as string) ? formatRevenue(parseInt(val as string)) : '—',
      reveal: (_val: Answer) => (
        <div className="mt-3 text-sm bg-zinc-800/40 rounded px-2 py-2">
          <span className="text-amber-400 font-bold">{formatRevenue(totalRevenue)}</span>
          {revenueFilmCount < filmCount && (
            <span className="text-zinc-500 ml-2 text-xs">({revenueFilmCount} films with data)</span>
          )}
        </div>
      ),
    },
  ].filter(q => q.available)

  const total = allQuestions.length

  // ── State ──────────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<(Answer | null)[]>(Array(total).fill(null))
  const [currentInputs, setCurrentInputs] = useState<(Answer | null)[]>(Array(total).fill(null))
  const [expanded, setExpanded] = useState<number | null>(null)

  const scores = allQuestions.map((q, i) => q.score(answers[i]))
  const totalScore = scores.reduce((a, b) => a + b, 0)
  const allAnswered = answers.every(a => a !== null && a !== '')
  const isDone = allAnswered

  function handleSubmit(idx: number) {
    const newAnswers = [...answers]
    newAnswers[idx] = currentInputs[idx]
    setAnswers(newAnswers)
    const newInputs = [...currentInputs]
    newInputs[idx] = null
    setCurrentInputs(newInputs)
  }

  function handleInputChange(idx: number, val: Answer) {
    const newInputs = [...currentInputs]
    newInputs[idx] = val
    setCurrentInputs(newInputs)
  }

  const canSubmit = (idx: number) => currentInputs[idx] !== null && currentInputs[idx] !== ''

  // ── Render ─────────────────────────────────────────────────────────────────

  const pct = isDone ? Math.round((totalScore / (total * 20)) * 100) : 0
  const headerScoreColor = isDone
    ? pct >= 80 ? 'text-amber-400' : pct >= 60 ? 'text-emerald-400' : 'text-zinc-300'
    : 'text-zinc-600'

  return (
    <div className="w-screen px-4 sm:px-6 py-6 space-y-3 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-3">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {actor.profile_path ? (
            <Image src={`${TMDB_IMAGE_BASE}${actor.profile_path}`} alt={actor.name} width={48} height={48}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-amber-400 flex items-center justify-center text-zinc-500 font-bold text-sm flex-shrink-0">
              {actor.name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white font-bold text-sm truncate">{actor.name}</div>
            <div className="text-zinc-500 text-xs">{filmCount} films</div>
          </div>
          {isDone && (
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-black ${headerScoreColor}`}>{totalScore}</div>
              <div className="text-zinc-600 text-xs">/ {total * 20}</div>
            </div>
          )}
        </div>
      </div>

      {/* Question cards */}
      <div className="space-y-2">
        {allQuestions.map((q, idx) => {
          const isAnswered = answers[idx] !== null && answers[idx] !== ''
          const score = scores[idx]
          const isExpanded = expanded === idx

          if (isAnswered) {
            return (
              <div key={q.key} className={`border rounded-xl p-3.5 transition-all ${cardStyle(score)}`}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : idx)}
                  className="w-full flex items-start justify-between gap-2 group"
                >
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      {medalEmoji(score) && <span className="text-lg flex-shrink-0">{medalEmoji(score)}</span>}
                      <span className="text-xs text-zinc-400 font-medium">{q.label}</span>
                    </div>
                    <div className="text-amber-400 text-sm font-semibold truncate mt-0.5">{q.answerLabel(answers[idx])}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{q.rankSummary(answers[idx])}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-lg font-black ${score === 20 ? 'text-amber-400' : score >= 16 ? 'text-zinc-300' : score >= 12 ? 'text-amber-700' : 'text-zinc-500'}`}>
                        {score}
                      </div>
                      <div className="text-zinc-600 text-xs">/20</div>
                    </div>
                    <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>
                </button>
                {isExpanded && q.reveal(answers[idx])}
              </div>
            )
          }

          // Unanswered question card
          return (
            <div key={q.key} className="border border-amber-500/40 bg-zinc-900/80 rounded-xl p-4 ring-1 ring-amber-500/20">
              <div className="mb-3">
                <div className="text-amber-400 text-xs font-semibold mb-1">Q{idx + 1} of {total}</div>
                <div className="text-white font-semibold text-sm">{q.question}</div>
                <div className="text-zinc-600 text-xs mt-1">{q.hint}</div>
              </div>
              {q.input(currentInputs[idx], (val) => handleInputChange(idx, val), false, () => handleSubmit(idx))}
            </div>
          )
        })}
      </div>

      {/* Footer (show when done) */}
      {isDone && (
        <div className="flex gap-2 pt-2">
          <Link href="/trivia/actor" className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-center">
            Try Another Actor
          </Link>
          <Link href={`/actor/${actor.id}`} className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-center">
            View Career
          </Link>
        </div>
      )}
      </div>
    </div>
  )
}
