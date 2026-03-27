import supabase from '../config/supabase.js'
import { verifyToken } from '../utils/jwt.js'

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing.' })
  }

  try {
    const payload = verifyToken(token)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', payload.sub)
      .single()

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token user.' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
