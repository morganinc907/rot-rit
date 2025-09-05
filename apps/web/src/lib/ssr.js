// Safe localStorage access for SSR compatibility
export function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? localStorage : null
  } catch {
    return null
  }
}

export function isBrowser() {
  return typeof window !== 'undefined'
}