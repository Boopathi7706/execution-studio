// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { HeapCard } from './HeapCard'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView } from '@/types/visualization.types'

describe('HeapCard & ArrayCard Components (Phase 1)', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders Program 1: Array card with int[] Length = 3 and indexed elements [0], [1], [2]', () => {
    const arrayObj: HeapObjectView = {
      objectId: 'obj_arr',
      type: 'array',
      classNameOrType: 'int[]',
      fieldsOrElements: {
        '[0]': { kind: 'int', value: 10, valueString: '10' },
        '[1]': { kind: 'int', value: 20, valueString: '20' },
        '[2]': { kind: 'int', value: 30, valueString: '30' },
      },
    }

    render(<HeapCard obj={arrayObj} previousModel={null} />)

    expect(screen.getByText('int[]')).toBeDefined()
    expect(screen.getByText('@obj_arr')).toBeDefined()
    expect(screen.getByText('Length =')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('[0]')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('[1]')).toBeDefined()
    expect(screen.getByText('20')).toBeDefined()
    expect(screen.getByText('[2]')).toBeDefined()
    expect(screen.getByText('30')).toBeDefined()
  })

  it('renders Program 2: Object card with Student and age = 20', () => {
    const studentObj: HeapObjectView = {
      objectId: 'obj_student',
      type: 'object',
      classNameOrType: 'Student',
      fieldsOrElements: {
        age: { kind: 'int', value: 20, valueString: '20' },
      },
    }

    render(<HeapCard obj={studentObj} previousModel={null} />)

    expect(screen.getByText('Student')).toBeDefined()
    expect(screen.getByText('@obj_student')).toBeDefined()
    expect(screen.getByText('age')).toBeDefined()
    expect(screen.getByText('20')).toBeDefined()
  })

  it('supports Expand and Collapse toggles with Zustand global state survival', () => {
    const obj: HeapObjectView = {
      objectId: 'obj_test',
      type: 'object',
      classNameOrType: 'Point',
      fieldsOrElements: {
        x: { kind: 'int', value: 5, valueString: '5' },
      },
    }

    const { rerender } = render(<HeapCard obj={obj} previousModel={null} />)
    expect(screen.getByText('x')).toBeDefined()

    // Click Collapse button
    const collapseBtn = screen.getByRole('button', { name: /collapse/i })
    fireEvent.click(collapseBtn)

    expect(usePlaybackStore.getState().expandedObjects['obj_test']).toBe(false)

    // Rerender (simulating timeline playback step)
    rerender(<HeapCard obj={obj} previousModel={null} />)

    // Field x should be hidden while collapsed
    expect(screen.queryByText('x')).toBeNull()

    // Click Expand button
    const expandBtn = screen.getByRole('button', { name: /expand/i })
    fireEvent.click(expandBtn)

    expect(usePlaybackStore.getState().expandedObjects['obj_test']).toBe(true)
    expect(screen.getByText('x')).toBeDefined()
  })

  it('renders reference array elements like [0] @obj_5', () => {
    const refArrayObj: HeapObjectView = {
      objectId: 'obj_ref_arr',
      type: 'array',
      classNameOrType: 'Student[]',
      fieldsOrElements: {
        '[0]': { kind: 'object_ref', objectId: 'obj_5' },
        '[1]': { kind: 'object_ref', objectId: 'obj_7' },
      },
    }

    render(<HeapCard obj={refArrayObj} previousModel={null} />)

    expect(screen.getByText('[0]')).toBeDefined()
    expect(screen.getByText('@obj_5')).toBeDefined()
    expect(screen.getByText('[1]')).toBeDefined()
    expect(screen.getByText('@obj_7')).toBeDefined()
  })
})
