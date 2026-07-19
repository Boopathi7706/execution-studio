import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

/**
 * Placeholder component for themed buttons.
 */
export const Button: React.FC<ButtonProps> = ({ label, ...props }) => {
  return <button {...props}>{label}</button>
}
