import { describe, it, expect } from 'vitest'
import { parseClassName } from './classNameParser'

describe('parseClassName', () => {
  it('should extract public class name from Java code', () => {
    const code = `
      package com.example;
      public class MyTest {
          public static void main(String[] args) {}
      }
    `
    expect(parseClassName(code)).toBe('MyTest')
  })

  it('should extract non-public class name if public class is missing', () => {
    const code = `
      class HelperApp {
          public static void main(String[] args) {}
      }
    `
    expect(parseClassName(code)).toBe('HelperApp')
  })

  it('should return default Main for empty or invalid source code', () => {
    expect(parseClassName('')).toBe('Main')
    expect(parseClassName('   ')).toBe('Main')
    expect(parseClassName('// Just a comment')).toBe('Main')
  })
})
