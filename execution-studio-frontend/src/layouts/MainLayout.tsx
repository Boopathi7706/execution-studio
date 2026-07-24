import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import ErrorBanner from '../components/common/ErrorBanner'
import { useAppStore } from '../store/useAppStore'

/**
 * Main application shell layout.
 * Combines Header, global error banner, main page Outlet, and Footer.
 */
export const MainLayout: React.FC = () => {
  const globalError = useAppStore((state) => state.globalError)
  const clearError = useAppStore((state) => state.clearError)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        height: 'auto',
        overflow: 'visible',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
      }}
    >
      <Header />
      {globalError && <ErrorBanner message={globalError} onClose={clearError} />}
      <main style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )

}

export default MainLayout
