const NAMESPACE = 'movie-rec'

function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`
}

export function getItem<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(namespacedKey(key))
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(namespacedKey(key), JSON.stringify(value))
}

export function removeItem(key: string): void {
  localStorage.removeItem(namespacedKey(key))
}
