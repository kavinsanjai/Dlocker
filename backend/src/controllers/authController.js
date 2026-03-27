import bcrypt from 'bcryptjs'
import supabase from '../config/supabase.js'
import asyncHandler from '../utils/asyncHandler.js'
import { signToken } from '../utils/jwt.js'

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email, and password are required.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const { data: createdUser, error: createError } = await supabase
    .from('users')
    .insert({
      full_name: fullName.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
    })
    .select('id, full_name, email')
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  return res.status(201).json({
    message: 'User registered successfully.',
    user: createdUser,
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password_hash')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const token = signToken(user)

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
    },
  })
})
