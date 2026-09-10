import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  forgotPassword,
  getMe,
  listUsers,
  loginUser,
  logout,
  refreshSession,
  registerUser,
  resendSignupOtp,
  resetPassword,
  setUserActive,
  verifyEmail,
} from '../services/authService.js'
import {
  getRoleById,
  listCustomers,
  listRoles,
  setRoleActive,
  updateRole,
} from '../services/adminRbacService.js'
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../utils/validation.js'

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const setUserActiveSchema = z.object({
  active: z.boolean(),
})

function ipHash(req) {
  const ip = req.ip || req.socket.remoteAddress || ''
  return createHash('sha256').update(ip).digest('hex')
}

export async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body)
    const result = await registerUser(body, ipHash(req))
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function verifyEmailHandler(req, res, next) {
  try {
    const body = verifyEmailSchema.parse(req.body)
    const result = await verifyEmail(body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function resendOtpHandler(req, res, next) {
  try {
    const body = resendOtpSchema.parse(req.body)
    const result = await resendSignupOtp(body.email, ipHash(req))
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body)
    const result = await loginUser(body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function forgot(req, res, next) {
  try {
    const body = forgotPasswordSchema.parse(req.body)
    const result = await forgotPassword(body.email, ipHash(req))
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function reset(req, res, next) {
  try {
    const body = resetPasswordSchema.parse(req.body)
    const result = await resetPassword(body)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const body = refreshSchema.parse(req.body)
    const tokens = await refreshSession(body.refreshToken)
    res.json(tokens)
  } catch (err) {
    next(err)
  }
}

export async function logoutHandler(req, res, next) {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined
    const result = await logout(refreshToken)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await getMe(req.userId)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function adminListUsers(req, res, next) {
  try {
    const query = listUsersQuerySchema.parse(req.query)
    const result = await listUsers(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function adminSetUserActive(req, res, next) {
  try {
    const body = setUserActiveSchema.parse(req.body)
    const result = await setUserActive(req.params.userId, body.active, req.userId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function adminListRoles(req, res, next) {
  try {
    const data = await listRoles()
    res.json({ data, totalItems: data.length })
  } catch (err) {
    next(err)
  }
}

export async function adminGetRole(req, res, next) {
  try {
    const data = await getRoleById(req.params.roleId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function adminSetRoleActive(req, res, next) {
  try {
    const body = setUserActiveSchema.parse(req.body)
    const data = await setRoleActive(req.params.roleId, body.active)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function adminUpdateRole(req, res, next) {
  try {
    const body = z
      .object({
        name: z.string().trim().min(1).optional(),
        description: z.string().trim().nullable().optional(),
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })
      .parse(req.body)
    const data = await updateRole(req.params.roleId, body)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function adminListCustomers(req, res, next) {
  try {
    const query = listUsersQuerySchema.parse(req.query)
    const result = await listCustomers(query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
