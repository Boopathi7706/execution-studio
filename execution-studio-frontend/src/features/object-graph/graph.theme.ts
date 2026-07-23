/**
 * Centralized theme styling for Cytoscape Memory Canvas & Object Reference Graph.
 */
export const GRAPH_THEME = {
  colors: {
    objectNode: '#a855f7', // Neon Violet for standard Java Object cards
    arrayNode: '#0ea5e9', // Sky Cyan for Array nodes
    linkedListNode: '#8b5cf6', // Deep Violet for Linked List nodes
    treeNode: '#10b981', // Emerald Green for Binary Tree nodes
    stackNode: '#f59e0b', // Amber Orange for Stack nodes
    queueNode: '#ec4899', // Pink for Queue nodes
    stringNode: '#06b6d4', // Cyan for String nodes
    nodeText: '#f8fafc', // Light primary text
    nodeBorder: '#334155', // Slate dark border
    selectedBg: '#e9d5ff', // Light violet glow
    selectedBorder: '#a855f7', // Accent border on selection
    edgeLine: '#64748b', // Slate edge line
    edgeArrow: '#64748b', // Slate edge arrow
    edgeText: '#cbd5e1', // Muted edge label text
    edgeBg: '#0f172a', // Edge label background pill
  },
  dimensions: {
    nodeSize: '72px',
    borderWidth: '2px',
    selectedBorderWidth: '4px',
    edgeWidth: 2,
  },
} as const

export default GRAPH_THEME
