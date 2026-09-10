import { query } from '../db/pool.js'
import { env } from '../config/env.js'
import {
  generateResetCode,
  hashPassword,
  newId,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
} from '../utils/crypto.js'
import { AppError } from '../utils/errors.js'
import { isMailConfigured, sendOtpEmail } from '../utils/mailer.js'
import { createCustomerProfile, getCustomerProfile } from './userClient.js'

async function issueAndSendEmailOtp(userId, email, ipHash) {
  const code = generateResetCode()
  const expires = new Date(Date.now() + env.otpTtlMinutes * 60 * 1000)

  await query(
    `UPDATE email_verification_tokens
     SET consumed_at_utc = NOW()
     WHERE user_id = $1 AND consumed_at_utc IS NULL`,
    [userId],
  )

  await query(
    `INSERT INTO email_verification_tokens (
      verification_token_id, user_id, code_hash, expires_at_utc, request_ip_hash
    ) VALUES ($1, $2, $3, $4, $5)`,
    [newId(), userId, sha256(code), expires.toISOString(), ipHash ?? null],
  )

  let mailSent = false
  let mailFailure = null
  try {
    const result = await sendOtpEmail({ to: email, code, purpose: 'verification' })
    mailSent = Boolean(result.sent)
    if (!mailSent) {
      mailFailure = result
      console.error('[auth] verification OTP not sent:', result.reason, result.detail ?? '')
    }
  } catch (err) {
    mailFailure = { reason: 'smtp_send_failed', detail: err.message }
    console.error('[auth] failed to send verification OTP email:', err.message)
    if (err.response) console.error('[auth] SMTP response:', err.response)
  }

  if (!mailSent && !env.exposeDemoResetCode) {
    if (mailFailure?.reason === 'smtp_not_configured') {
      throw new AppError(
        'Email is not configured on the server. Set SMTP_HOST, SMTP_USER, and SMTP_PASS on frigo-auth in Render.',
        503,
        'SMTP_NOT_CONFIGURED',
      )
    }
    throw new AppError(
      `Could not send verification email${mailFailure?.detail ? `: ${mailFailure.detail}` : '.'}`,
      503,
      'SMTP_SEND_FAILED',
    )
  }

  return {
    message: mailSent
      ? 'We sent a verification code to your email.'
      : 'Account created. Use the demo verification code (SMTP is not configured).',
    email,
    ...(env.exposeDemoResetCode || !mailSent ? { demoCode: code } : {}),
  }
}

async function getRolesAndPermissions(userId) {
  const rolesResult = await query(
    `SELECT r.role_code
     FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id
     WHERE ur.user_id = $1 AND ur.revoked_at_utc IS NULL AND r.is_active = true`,
    [userId],
  )

  const permissionsResult = await query(
    `SELECT DISTINCT p.permission_code
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE ur.user_id = $1
       AND ur.revoked_at_utc IS NULL
       AND p.is_active = true`,
    [userId],
  )

  return {
    roles: rolesResult.rows.map((r) => r.role_code),
    permissions: permissionsResult.rows.map((p) => p.permission_code),
  }
}

async function toAuthUser(user) {
  const { roles, permissions } = await getRolesAndPermissions(user.user_id)
  const profile = await getCustomerProfile(user.user_id)
  return {
    id: user.user_id,
    email: user.email,
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    roles,
    permissions,
    status: user.user_status,
  }
}

async function issueTokens(userId, email) {
  const familyId = newId()
  const refreshTokenId = newId()
  const { token: accessToken, expiresAt } = signAccessToken({
    sub: userId,
    email,
    typ: 'access',
  })
  const refreshToken = signRefreshToken({
    sub: userId,
    jti: refreshTokenId,
    familyId,
    typ: 'refresh',
  })

  const expiresAtUtc = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000)
  await query(
    `INSERT INTO refresh_tokens (
      refresh_token_id, user_id, token_hash, family_id, expires_at_utc
    ) VALUES ($1, $2, $3, $4, $5)`,
    [refreshTokenId, userId, sha256(refreshToken), familyId, expiresAtUtc.toISOString()],
  )

  return { accessToken, refreshToken, expiresAt }
}

async function assignRole(userId, roleCode) {
  const role = await query(
    `SELECT role_id FROM roles WHERE role_code = $1 AND is_active = true`,
    [roleCode],
  )
  if (!role.rows[0]) throw new AppError(`Role ${roleCode} is not configured`, 500)
  await query(
    `INSERT INTO user_roles (user_role_id, user_id, role_id) VALUES ($1, $2, $3)`,
    [newId(), userId, role.rows[0].role_id],
  )
}

export async function registerUser(input, ipHash) {
  const email = input.email.trim().toLowerCase()
  const existing = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const existingUser = existing.rows[0]

  if (existingUser?.email_verified_at_utc) {
    throw new AppError('An account with this email already exists.', 409)
  }

  const passwordHash = await hashPassword(input.password)
  let userId = existingUser?.user_id

  if (existingUser) {
    await query(
      `UPDATE users
       SET password_hash = $2,
           user_status = 'ACTIVE',
           account_status = 'ACTIVE',
           failed_login_count = 0,
           locked_until_utc = NULL,
           updated_at_utc = NOW()
       WHERE user_id = $1`,
      [userId, passwordHash],
    )
    await createCustomerProfile({
      userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    })
  } else {
    userId = newId()
    await query(
      `INSERT INTO users (user_id, email, password_hash, user_status, account_status)
       VALUES ($1, $2, $3, 'ACTIVE', 'ACTIVE')`,
      [userId, email, passwordHash],
    )
    await assignRole(userId, 'CUSTOMER')
    await createCustomerProfile({
      userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    })
    await query(
      `INSERT INTO auth_outbox (event_id, event_type, aggregate_type, aggregate_id, payload_json)
       VALUES ($1, 'UserRegistered', 'User', $2, $3)`,
      [newId(), userId, JSON.stringify({ userId, email })],
    )
  }

  return issueAndSendEmailOtp(userId, email, ipHash)
}

export async function verifyEmail(input) {
  const email = input.email.trim().toLowerCase()
  const code = input.code.trim()
  const userResult = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = userResult.rows[0]
  if (!user || user.user_status === 'DELETED') {
    throw new AppError('Invalid or expired verification code. Request a new one.', 400)
  }

  if (user.email_verified_at_utc) {
    const authUser = await toAuthUser(user)
    const tokens = await issueTokens(user.user_id, user.email)
    return { user: authUser, tokens }
  }

  const tokenResult = await query(
    `SELECT verification_token_id, code_hash, expires_at_utc
     FROM email_verification_tokens
     WHERE user_id = $1 AND consumed_at_utc IS NULL
     ORDER BY created_at_utc DESC
     LIMIT 1`,
    [user.user_id],
  )
  const token = tokenResult.rows[0]
  if (!token || token.expires_at_utc < new Date() || token.code_hash !== sha256(code)) {
    throw new AppError('Invalid or expired verification code. Request a new one.', 400)
  }

  await query(
    `UPDATE users
     SET email_verified_at_utc = NOW(),
         updated_at_utc = NOW()
     WHERE user_id = $1`,
    [user.user_id],
  )
  await query(
    `UPDATE email_verification_tokens
     SET consumed_at_utc = NOW()
     WHERE verification_token_id = $1`,
    [token.verification_token_id],
  )
  await query(
    `INSERT INTO auth_outbox (event_id, event_type, aggregate_type, aggregate_id, payload_json)
     VALUES ($1, 'EmailVerified', 'User', $2, $3)`,
    [newId(), user.user_id, JSON.stringify({ userId: user.user_id, email })],
  )

  const verified = await query(`SELECT * FROM users WHERE user_id = $1`, [user.user_id])
  const authUser = await toAuthUser(verified.rows[0])
  const tokens = await issueTokens(user.user_id, user.email)
  return { user: authUser, tokens }
}

export async function resendSignupOtp(emailRaw, ipHash) {
  const email = emailRaw.trim().toLowerCase()
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = result.rows[0]

  if (!user || user.user_status === 'DELETED') {
    throw new AppError('No pending signup found for that email.', 404)
  }
  if (user.email_verified_at_utc) {
    throw new AppError('This email is already verified. You can sign in.', 400)
  }

  return issueAndSendEmailOtp(user.user_id, email, ipHash)
}

export async function loginUser(input) {
  const email = input.email.trim().toLowerCase()
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = result.rows[0]

  if (!user) throw new AppError('Invalid email or password.', 401)

  if (user.user_status === 'DELETED' || user.user_status === 'SUSPENDED') {
    throw new AppError('This account is not available.', 403)
  }
  if (user.account_status === 'DISABLED') {
    throw new AppError('This account is disabled.', 403)
  }
  if (user.account_status === 'LOCKED' || (user.locked_until_utc && user.locked_until_utc > new Date())) {
    throw new AppError('This account is temporarily locked. Try again later.', 403)
  }
  if (!user.email_verified_at_utc) {
    throw new AppError('Please verify your email before signing in.', 403, 'EMAIL_NOT_VERIFIED')
  }

  const valid = await verifyPassword(input.password, user.password_hash)
  if (!valid) {
    await query(
      `UPDATE users
       SET failed_login_count = failed_login_count + 1,
           locked_until_utc = CASE
             WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until_utc
           END,
           account_status = CASE
             WHEN failed_login_count + 1 >= 5 THEN 'LOCKED'
             ELSE account_status
           END,
           updated_at_utc = NOW()
       WHERE user_id = $1`,
      [user.user_id],
    )
    throw new AppError('Invalid email or password.', 401)
  }

  await query(
    `UPDATE users
     SET failed_login_count = 0,
         locked_until_utc = NULL,
         account_status = 'ACTIVE',
         last_login_at_utc = NOW(),
         updated_at_utc = NOW()
     WHERE user_id = $1`,
    [user.user_id],
  )

  const authUser = await toAuthUser(user)
  const tokens = await issueTokens(user.user_id, user.email)
  return { user: authUser, tokens }
}

export async function forgotPassword(emailRaw, ipHash) {
  const email = emailRaw.trim().toLowerCase()
  const message = 'If an account exists for that email, we sent a password reset code.'
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = result.rows[0]

  if (!user || user.user_status === 'DELETED') {
    return { message }
  }

  const code = generateResetCode()
  const expires = new Date(Date.now() + env.resetCodeTtlMinutes * 60 * 1000)

  await query(
    `UPDATE password_reset_tokens
     SET consumed_at_utc = NOW()
     WHERE user_id = $1 AND consumed_at_utc IS NULL`,
    [user.user_id],
  )

  await query(
    `INSERT INTO password_reset_tokens (reset_token_id, user_id, code_hash, expires_at_utc, request_ip_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [newId(), user.user_id, sha256(code), expires.toISOString(), ipHash ?? null],
  )

  await query(
    `INSERT INTO auth_outbox (event_id, event_type, aggregate_type, aggregate_id, payload_json)
     VALUES ($1, 'PasswordResetRequested', 'User', $2, $3)`,
    [newId(), user.user_id, JSON.stringify({ userId: user.user_id, email })],
  )

  let mailSent = false
  try {
    const result = await sendOtpEmail({ to: email, code, purpose: 'password_reset' })
    mailSent = Boolean(result.sent)
  } catch (err) {
    console.error('[auth] failed to send password reset email:', err.message)
  }

  const exposeDemo = env.exposeDemoResetCode || !isMailConfigured()
  return {
    message,
    ...(exposeDemo ? { demoCode: code } : {}),
  }
}

export async function resetPassword(input) {
  const email = input.email.trim().toLowerCase()
  const userResult = await query(`SELECT * FROM users WHERE email = $1`, [email])
  const user = userResult.rows[0]
  if (!user) {
    throw new AppError('Invalid or expired reset code. Request a new one.', 400)
  }

  const tokenResult = await query(
    `SELECT reset_token_id, code_hash, expires_at_utc
     FROM password_reset_tokens
     WHERE user_id = $1 AND consumed_at_utc IS NULL
     ORDER BY created_at_utc DESC
     LIMIT 1`,
    [user.user_id],
  )
  const token = tokenResult.rows[0]
  if (!token || token.expires_at_utc < new Date() || token.code_hash !== sha256(input.code.trim())) {
    throw new AppError('Invalid or expired reset code. Request a new one.', 400)
  }

  const passwordHash = await hashPassword(input.password)
  await query(
    `UPDATE users
     SET password_hash = $1,
         failed_login_count = 0,
         locked_until_utc = NULL,
         account_status = 'ACTIVE',
         updated_at_utc = NOW()
     WHERE user_id = $2`,
    [passwordHash, user.user_id],
  )
  await query(
    `UPDATE password_reset_tokens SET consumed_at_utc = NOW() WHERE reset_token_id = $1`,
    [token.reset_token_id],
  )
  await query(
    `UPDATE refresh_tokens SET revoked_at_utc = NOW()
     WHERE user_id = $1 AND revoked_at_utc IS NULL`,
    [user.user_id],
  )

  return { message: 'Your password has been updated. You can sign in now.' }
}

export async function refreshSession(refreshToken) {
  let payload
  try {
    const { verifyRefreshToken } = await import('../utils/crypto.js')
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid refresh token.', 401)
  }

  const stored = await query(
    `SELECT refresh_token_id, revoked_at_utc, expires_at_utc, family_id
     FROM refresh_tokens WHERE token_hash = $1`,
    [sha256(refreshToken)],
  )
  const row = stored.rows[0]
  if (!row || row.revoked_at_utc || row.expires_at_utc < new Date()) {
    throw new AppError('Invalid refresh token.', 401)
  }

  await query(
    `UPDATE refresh_tokens SET revoked_at_utc = NOW() WHERE refresh_token_id = $1`,
    [row.refresh_token_id],
  )

  const userResult = await query(`SELECT * FROM users WHERE user_id = $1`, [payload.sub])
  const user = userResult.rows[0]
  if (!user) throw new AppError('Invalid refresh token.', 401)

  return issueTokens(user.user_id, user.email)
}

export async function logout(refreshToken) {
  if (!refreshToken) return { success: true }
  await query(
    `UPDATE refresh_tokens SET revoked_at_utc = NOW()
     WHERE token_hash = $1 AND revoked_at_utc IS NULL`,
    [sha256(refreshToken)],
  )
  return { success: true }
}

export async function getMe(userId) {
  const result = await query(`SELECT * FROM users WHERE user_id = $1`, [userId])
  const user = result.rows[0]
  if (!user) throw new AppError('User not found', 404)
  return toAuthUser(user)
}

export async function listUsers({ page = 1, pageSize = 20 } = {}) {
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM users`)
  const totalItems = countResult.rows[0].total
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const offset = (page - 1) * pageSize

  const result = await query(
    `SELECT u.user_id, u.email, u.user_status, u.account_status, u.created_at_utc,
            cp.first_name, cp.last_name,
            COALESCE(
              (
                SELECT array_agg(r.role_code ORDER BY r.role_code)
                FROM user_roles ur
                JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                  AND ur.revoked_at_utc IS NULL
                  AND r.is_active = true
              ),
              '{}'::text[]
            ) AS roles
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.user_id = u.user_id
     ORDER BY u.created_at_utc DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset],
  )

  return {
    data: result.rows.map((row) => ({
      id: row.user_id,
      email: row.email,
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      roles: row.roles ?? [],
      status: row.user_status,
      accountStatus: row.account_status,
      createdAt: row.created_at_utc,
      isActive: row.user_status === 'ACTIVE' && row.account_status === 'ACTIVE',
    })),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}

export async function setUserActive(targetUserId, active, actorUserId) {
  if (!targetUserId) throw new AppError('User id is required', 400)
  if (targetUserId === actorUserId) {
    throw new AppError('You cannot deactivate your own account.', 400)
  }

  const existing = await query(`SELECT user_id, user_status FROM users WHERE user_id = $1`, [
    targetUserId,
  ])
  const user = existing.rows[0]
  if (!user) throw new AppError('User not found', 404)
  if (user.user_status === 'DELETED') {
    throw new AppError('Deleted users cannot be reactivated here.', 400)
  }

  if (active) {
    await query(
      `UPDATE users
       SET user_status = 'ACTIVE',
           account_status = 'ACTIVE',
           failed_login_count = 0,
           locked_until_utc = NULL,
           updated_at_utc = NOW()
       WHERE user_id = $1`,
      [targetUserId],
    )
  } else {
    await query(
      `UPDATE users
       SET account_status = 'DISABLED',
           updated_at_utc = NOW()
       WHERE user_id = $1`,
      [targetUserId],
    )
    await query(
      `UPDATE refresh_tokens
       SET revoked_at_utc = NOW()
       WHERE user_id = $1 AND revoked_at_utc IS NULL`,
      [targetUserId],
    )
  }

  const result = await query(
    `SELECT u.user_id, u.email, u.user_status, u.account_status, u.created_at_utc,
            cp.first_name, cp.last_name,
            COALESCE(
              (
                SELECT array_agg(r.role_code ORDER BY r.role_code)
                FROM user_roles ur
                JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                  AND ur.revoked_at_utc IS NULL
                  AND r.is_active = true
              ),
              '{}'::text[]
            ) AS roles
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.user_id = u.user_id
     WHERE u.user_id = $1`,
    [targetUserId],
  )
  const row = result.rows[0]
  return {
    id: row.user_id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    roles: row.roles ?? [],
    status: row.user_status,
    accountStatus: row.account_status,
    createdAt: row.created_at_utc,
    isActive: row.user_status === 'ACTIVE' && row.account_status === 'ACTIVE',
  }
}
