import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || ''
const apiUrl = rawApiUrl.replace(/\/$/, '')

const api = axios.create({
  baseURL: apiUrl ? `${apiUrl}/api` : '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('locker_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
