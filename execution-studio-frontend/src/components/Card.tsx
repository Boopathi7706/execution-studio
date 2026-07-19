import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
}

/**
 * Placeholder card panel container.
 */
export const Card: React.FC<CardProps> = ({ children, title }) => {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  )
}
