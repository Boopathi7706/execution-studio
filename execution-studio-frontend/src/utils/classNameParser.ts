/**
 * Utility function to parse Java source code and extract the primary public or first declared class name.
 */
export function parseClassName(sourceCode: string): string {
  if (!sourceCode || !sourceCode.trim()) {
    return 'Main'
  }

  // 1. Look for public class declaration
  const publicClassMatch = sourceCode.match(/public\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/)
  if (publicClassMatch && publicClassMatch[1]) {
    return publicClassMatch[1]
  }

  // 2. Look for any class declaration
  const anyClassMatch = sourceCode.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/)
  if (anyClassMatch && anyClassMatch[1]) {
    return anyClassMatch[1]
  }

  return 'Main'
}
