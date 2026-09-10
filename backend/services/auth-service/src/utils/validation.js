import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, 'Password must include letters')
    .regex(/\d/, 'Password must include numbers'),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().min(4),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, 'Password must include letters')
    .regex(/\d/, 'Password must include numbers'),
})

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().min(4).max(12),
})

export const resendOtpSchema = z.object({
  email: z.string().email(),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})
