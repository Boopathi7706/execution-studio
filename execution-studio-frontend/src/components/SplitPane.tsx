import React from 'react'

interface SplitPaneProps {
  children: React.ReactNode
}

/**
 * Placeholder component for split panel resizing.
 */
export const SplitPane: React.FC<SplitPaneProps> = ({ children }) => {
  return <div className="split-pane">{children}</div>
}
