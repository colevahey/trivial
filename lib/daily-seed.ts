/**
 * Shared utilities for daily seeded randomization
 * Used by six degrees trivia and actor trivia daily challenges
 */

export const SEED_ACTOR_IDS = [
  287,      // Brad Pitt
  6193,     // Leonardo DiCaprio
  1245,     // Scarlett Johansson
  3223,     // Robert Downey Jr.
  2524,     // Tom Hanks
  1283,     // Meryl Streep
  1327,     // Denzel Washington
  500,      // Tom Cruise
  2888,     // Will Smith
  16828,    // Matt Damon
  1204,     // Julia Roberts
  10993,    // Cate Blanchett
  2037,     // Morgan Freeman
  18269,    // Chris Evans
  74568,    // Chris Hemsworth
  1333,     // Russell Crowe
  12835,    // Christian Bale
  8784,     // Daniel Craig
  1357644,  // Timothée Chalamet
  5292,     // Hugh Jackman
  2231,     // Samuel L. Jackson
  6384,     // Keanu Reeves
  524,      // Natalie Portman
  1461,     // George Clooney
  85,       // Johnny Depp
  2227,     // Nicole Kidman
  4173,     // Anthony Hopkins
  131,      // Jake Gyllenhaal
  72129,    // Jennifer Lawrence
  6885,     // Charlize Theron
  73421,    // Joaquin Phoenix
  18918,    // Dwayne Johnson
  30614,    // Ryan Gosling
  54693,    // Emma Stone
  1813,     // Anne Hathaway
  10859,    // Ryan Reynolds
  71580,    // Benedict Cumberbatch
  1023139,  // Adam Driver
  505710,   // Zendaya
  1373737,  // Florence Pugh
]

/**
 * Derive a deterministic seed from the current date
 * Same seed = same day worldwide
 */
export function getDailySeed(): number {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0
  }
  return hash
}

/**
 * Mulberry32 — a fast, simple 32-bit seeded PRNG
 * Returns a function that yields a new [0,1) float on each call
 */
export function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates shuffle using a seeded random function
 * Ensures deterministic shuffling for the same seed
 */
export function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/**
 * Get today's date label for display (e.g. "Apr 14")
 */
export function getDailyDateLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
