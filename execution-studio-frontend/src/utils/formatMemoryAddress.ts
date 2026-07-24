/**
 * Formats object identifiers into clean, textbook-style Java memory addresses (e.g. 0x1, 0x2, 0x7).
 * In Developer Mode, returns the raw object identifier (e.g. obj_1, @1423).
 */
export function formatMemoryAddress(objectId?: string | null, isDeveloperMode = false): string {
  if (!objectId) return 'null'
  if (isDeveloperMode) return objectId

  const clean = objectId.replace(/^@/, '').trim()

  // Match obj_X or Node_X or numeric X
  const match = clean.match(/(?:obj|node|arr|item|elem|ptr)?_?(\d+)/i)
  if (match && match[1]) {
    const num = parseInt(match[1], 10)
    return `0x${num.toString(16)}`
  }

  // Fallback: Hash code to single/double hex digit (1 to f)
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i)
    hash |= 0
  }
  const positive = (Math.abs(hash) % 15) + 1
  return `0x${positive.toString(16)}`
}
