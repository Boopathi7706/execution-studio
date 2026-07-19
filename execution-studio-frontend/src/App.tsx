import React from 'react'
import Header from './layout/Header'
import Footer from './layout/Footer'
import WorkspaceContainer from './features/workspace/WorkspaceContainer'

import './App.css'

export const App: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header />
      <WorkspaceContainer />
      <Footer />
    </div>
  )
}

export default App
