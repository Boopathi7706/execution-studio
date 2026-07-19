import React from 'react'

interface ScrubberProps {
  value: number
  max: number
  onChange: (value: number) => void
}

/**
 * Placeholder component for timeline slider progress.
 */
export const Scrubber: React.FC<ScrubberProps> = ({ value, max, onChange }) => {
  return (
    <input
      type="range"
      min={0}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}
