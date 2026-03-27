import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, authLoading } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await register(form)
      setSuccess('Registration complete. You can now login.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to register.')
    }
  }

  return (
    <section className="auth-card" data-testid="register-page">
      <h1 className="page-title">Create Account</h1>
      <p className="page-subtitle">Your personal Digital Document Locker starts here.</p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label htmlFor="register-name">
          Full Name
          <input
            id="register-name"
            name="fullName"
            type="text"
            data-testid="register-name"
            value={form.fullName}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="register-email">
          Email
          <input
            id="register-email"
            name="email"
            type="email"
            data-testid="register-email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="register-password">
          Password
          <input
            id="register-password"
            name="password"
            type="password"
            data-testid="register-password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        <button
          id="register-submit"
          data-testid="register-submit"
          type="submit"
          className="btn btn-primary"
          disabled={authLoading}
        >
          {authLoading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <p className="helper-row">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  )
}
