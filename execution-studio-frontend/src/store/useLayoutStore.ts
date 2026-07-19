import { create } from 'zustand'

interface LayoutState {
  sidebarWidth: number
  canvasScale: number
  activeTab: 'list' | 'graph'
  setSidebarWidth: (width: number) => void
  setCanvasScale: (scale: number) => void
  setActiveTab: (tab: 'list' | 'graph') => void
}

/**
 * Layout configuration parameters store placeholder.
 */
export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarWidth: 350,
  canvasScale: 1.0,
  activeTab: 'list',

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
