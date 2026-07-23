/**
 * Centralized theme styling for Cytoscape Object Reference Graph visualization.
 */
export const GRAPH_THEME = {
  colors: {
    objectNode: '#a855f7', // Neon Violet for standard Java Object nodes
    arrayNode: '#0ea5e9', // Sky Cyan for Array nodes
    stringNode: '#10b981', // Emerald Green for String nodes
    nodeText: '#f8fafc', // Light primary text
    nodeBorder: '#334155', // Slate dark border
    selectedBg: '#e9d5ff', // Light violet glow
    selectedBorder: '#a855f7', // Accent border on selection
    edgeLine: '#475569', // Slate edge line
    edgeArrow: '#475569', // Slate edge arrow
    edgeText: '#94a3b8', // Muted edge label text
    edgeBg: '#0f172a', // Edge label background pill
  },
  dimensions: {
    nodeSize: '64px',
    borderWidth: '2px',
    selectedBorderWidth: '4px',
    edgeWidth: 2,
  },
} as const

export default GRAPH_THEME
