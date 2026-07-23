import { create } from 'zustand'

export type LayoutPreset = 'learning' | 'debug' | 'memory' | 'presentation' | 'compact' | 'custom'
export type PanelId = 'editor' | 'graph' | 'variables' | 'heap' | 'stack' | 'inspector' | 'events' | 'timeline'
export type DockTabId = 'variables' | 'heap' | 'stack' | 'inspector' | 'events'

export interface LayoutState {
  sidebarWidth: number
  canvasScale: number
  activeTab: 'list' | 'graph'
  preset: LayoutPreset
  activeDockTab: DockTabId
  panelVisibilities: Record<PanelId, boolean>

  setSidebarWidth: (width: number) => void
  setCanvasScale: (scale: number) => void
  setActiveTab: (tab: 'list' | 'graph') => void
  setActiveDockTab: (tab: DockTabId) => void
  setPreset: (preset: LayoutPreset) => void
  togglePanelVisibility: (panelId: PanelId) => void
  setPanelVisibility: (panelId: PanelId, visible: boolean) => void
  resetLayout: () => void
}

const DEFAULT_VISIBILITIES: Record<PanelId, boolean> = {
  editor: true,
  graph: true,
  variables: true,
  heap: true,
  stack: true,
  inspector: true,
  events: true,
  timeline: true,
}

const PRESET_VISIBILITIES: Record<LayoutPreset, Record<PanelId, boolean>> = {
  learning: { ...DEFAULT_VISIBILITIES },
  debug: {
    editor: true,
    graph: true,
    variables: true,
    heap: false,
    stack: true,
    inspector: true,
    events: true,
    timeline: true,
  },
  memory: {
    editor: true,
    graph: true,
    variables: false,
    heap: true,
    stack: false,
    inspector: true,
    events: false,
    timeline: true,
  },
  presentation: {
    editor: true,
    graph: true,
    variables: false,
    heap: false,
    stack: false,
    inspector: false,
    events: false,
    timeline: true,
  },
  compact: {
    editor: true,
    graph: true,
    variables: true,
    heap: true,
    stack: true,
    inspector: false,
    events: false,
    timeline: true,
  },
  custom: { ...DEFAULT_VISIBILITIES },
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarWidth: 500,
  canvasScale: 1.0,
  activeTab: 'graph',
  preset: 'learning',
  activeDockTab: 'variables',
  panelVisibilities: { ...DEFAULT_VISIBILITIES },

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveDockTab: (tab) => set({ activeDockTab: tab }),

  setPreset: (preset) => {
    if (preset === 'custom') {
      set({ preset: 'custom' })
      return
    }
    set({
      preset,
      panelVisibilities: { ...PRESET_VISIBILITIES[preset] },
    })
  },

  togglePanelVisibility: (panelId) => {
    const { panelVisibilities } = get()
    set({
      preset: 'custom',
      panelVisibilities: {
        ...panelVisibilities,
        [panelId]: !panelVisibilities[panelId],
      },
    })
  },

  setPanelVisibility: (panelId, visible) => {
    const { panelVisibilities } = get()
    set({
      preset: 'custom',
      panelVisibilities: {
        ...panelVisibilities,
        [panelId]: visible,
      },
    })
  },

  resetLayout: () =>
    set({
      preset: 'learning',
      sidebarWidth: 500,
      activeDockTab: 'variables',
      panelVisibilities: { ...DEFAULT_VISIBILITIES },
    }),
}))
