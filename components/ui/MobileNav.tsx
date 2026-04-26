'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/six-degrees', label: 'Six Degrees' },
  { href: '/trivia', label: 'Trivia' },
  { href: '/trivia/actor', label: 'Actor Trivia' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        className="flex items-center justify-center w-7 h-7 bg-amber-500 rounded-md flex-shrink-0 sm:hidden"
      >
        <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      </button>

      {/* Backdrop — covers content below header only */}
      {open && (
        <div
          className="fixed top-14 inset-x-0 bottom-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — z-[51] ensures it always paints above the backdrop compositing layer */}
      <div
        className={`fixed top-14 left-0 bottom-0 w-64 z-[51] bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 sm:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
