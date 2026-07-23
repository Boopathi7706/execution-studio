// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ObjectInspectorPanel } from './ObjectInspectorPanel'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

const mockVal = (
  kind: 'primitive' | 'object_ref' | 'array_ref' | 'string' | 'null',
  rawValue: string,
  objectId?: string,
): DisplayValue => ({
  kind,
  value: rawValue,
  valueString: rawValue,
  objectId,
})

const mockHeapObject = (
  objectId: string,
  type: 'object' | 'array',
  classNameOrType: string,
  fields: Record<string, DisplayValue>,
): HeapObjectView => ({
  objectId,
  type,
  classNameOrType,
  fieldsOrElements: fields,
})

describe('ObjectInspectorPanel Invariant Tests (Milestone 6)', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders prompt message when no object is selected', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      selectedObjectId: null,
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
        status: 'RUNNING',
      },
    })

    const { container } = render(<ObjectInspectorPanel />)
    expect(container.querySelector('.inspector-empty')).toBeDefined()
    expect(screen.getByText(/Select an Object Card, Variable Reference, or Graph Node/i)).toBeDefined()
  })

  it('displays accurate fields, incoming references, and outgoing references for selected object', () => {
    const addrObj = mockHeapObject('0x0020', 'object', 'Address', {
      city: mockVal('string', 'Chennai'),
    })

    const studentObj = mockHeapObject('0x0010', 'object', 'Student', {
      name: mockVal('string', 'Alice'),
      address: mockVal('object_ref', '0x0020', '0x0020'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      selectedObjectId: '0x0020',
      currentModel: {
        stack: { frames: [] },
        heap: {
          objects: {
            '0x0010': studentObj,
            '0x0020': addrObj,
          },
        },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
        status: 'RUNNING',
      },
    })

    render(<ObjectInspectorPanel />)

    expect(screen.getByText('Address@0x0020')).toBeDefined()
    expect(screen.getByText('city')).toBeDefined()
    expect(screen.getByText('"Chennai"')).toBeDefined()
    expect(screen.getByText('Student@0x0010')).toBeDefined()
  })
})
