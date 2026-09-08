import { createHash, randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { env } from '../config/env.js'

export function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds)
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function generateResetCode() {
  return String(randomInt(100000, 999999))
}

export function signAccessToken(payload) {
  const expiresAt = Date.now() + env.accessTokenTtlSeconds * 1000
  const token = jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtlSeconds,
  })
  return { token, expiresAt }
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: `${env.refreshTokenTtlDays}d`,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret)
}

export function newId() {
  return uuidv4()
}
