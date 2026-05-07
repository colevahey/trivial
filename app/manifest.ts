import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trivial',
    short_name: 'Trivial',
    description: 'Explore actor careers, discover connections, and play movie games.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icon/md',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/lg',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
