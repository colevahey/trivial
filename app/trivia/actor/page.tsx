'use client'

import { useRouter } from 'next/navigation'
import { ActorSearch } from '@/components/ui/ActorSearch'
import type { SearchResult } from '@/lib/types'

export default function ActorTriviaLandingPage() {
  const router = useRouter()

  function handleSelect(result: SearchResult) {
    if (result.mediaType === 'person') {
      router.push(`/trivia/actor/${result.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
        <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <h1 className="text-5xl font-black text-white mb-4">Actor Trivia</h1>
      <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
        How well do you know an actor's career? Guess their highest-grossing film, debut year, ratings, and more. Score based on how close you get.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-left">
        <h2 className="text-white font-bold text-base mb-4">How it works</h2>
        <div className="space-y-3">
          {[
            { num: '1', text: 'Search for any actor or actress below' },
            { num: '2', text: 'Answer 5 questions about their career' },
            { num: '3', text: 'Get points based on accuracy — top picks revealed after you submit' },
          ].map(step => (
            <div key={step.num} className="flex gap-3 items-start">
              <div className="w-6 h-6 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">
                {step.num}
              </div>
              <span className="text-zinc-400 text-sm">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      <ActorSearch
        onSelect={handleSelect}
        placeholder="Search for an actor..."
        className="w-full"
        personOnly
      />
    </div>
  )
}
