import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, authLoading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to login.')
    }
  }

  return (
    <section className="auth-card" data-testid="login-page">
      <h1 className="page-title">Welcome Back</h1>
      <p className="page-subtitle">Login to manage your secure documents.</p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label htmlFor="login-email">
          Email
          <input
            id="login-email"
            name="email"
            type="email"
            data-testid="login-email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="login-password">
          Password
          <input
            id="login-password"
            name="password"
            type="password"
            data-testid="login-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button
          id="login-submit"
          data-testid="login-submit"
          type="submit"
          className="btn btn-primary"
          disabled={authLoading}
        >
          {authLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}

      <p className="helper-row">
        Need an account? <Link to="/register">Create one</Link>
      </p>
    </section>
  )
}
