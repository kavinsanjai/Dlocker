import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('locker_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('locker_theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true"></div>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
      >
        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </button>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App
