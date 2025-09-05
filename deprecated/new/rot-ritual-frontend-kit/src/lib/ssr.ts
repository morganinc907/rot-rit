export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export function safeLocalStorage() {
  if (!isBrowser) return null as unknown as Storage | null
  try { return window.localStorage } catch { return null }
}

export function safeFetch(): typeof fetch {
  if (typeof fetch !== 'undefined') return fetch
  throw new Error('fetch is not available in this environment')
}
