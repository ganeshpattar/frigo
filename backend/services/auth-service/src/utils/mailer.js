import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter

function getTransporter() {
  if (!env.smtpConfigured) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 25_000,
    })
  }
  return transporter
}

export function isMailConfigured() {
  return env.smtpConfigured
}

/** Gmail only allows From = authenticated user (or verified Send mail as). */
function resolveFromAddress() {
  const configured = env.smtpFrom || ''
  const user = env.smtpUser
  if (!configured) return user
  // If From uses a different mailbox than SMTP_USER, Gmail rejects it.
  const emailMatch = configured.match(/<([^>]+)>/)
  const fromEmail = (emailMatch ? emailMatch[1] : configured).trim().toLowerCase()
  if (fromEmail === user.toLowerCase()) return configured
  // Keep brand display name, send via authenticated Gmail
  const nameMatch = configured.match(/^"?([^"<]+)"?\s*</)
  const displayName = nameMatch?.[1]?.trim() || 'Tirumala Foods'
  return `"${displayName}" <${user}>`
}

function buildOtpEmail({ code, purpose }) {
  const isReset = purpose === 'password_reset'
  const subject = isReset
    ? 'Tirumala Foods — password reset code'
    : 'Tirumala Foods — email verification code'
  const headline = isReset ? 'Reset your password' : 'Verify your email'
  const intro = isReset
    ? 'Use the code below to reset your Tirumala Foods account password.'
    : 'Use the code below to verify your Tirumala Foods account.'
  const digits = String(code)
    .padStart(6, '0')
    .slice(0, 6)
    .split('')
    .map(
      (d) =>
        `<td style="width:40px;height:48px;border:1px solid #f5c2c2;border-radius:10px;background:#fdf2f2;text-align:center;font-size:22px;font-weight:700;color:#900000;letter-spacing:0;">${d}</td>`,
    )
    .join('<td style="width:8px;"></td>')

  const text = [
    `Tirumala Foods`,
    '',
    headline,
    intro,
    '',
    `Your code: ${code}`,
    '',
    `This code expires in ${env.otpTtlMinutes} minutes.`,
    'If you did not request this, you can ignore this email.',
    '',
    '— Support · Tirumala Foods',
    'support@tirumalafoods.com',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f6f3ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eadfd4;">
          <tr>
            <td style="background:#900000;padding:28px 32px;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;color:#ffffff;">Tirumala Foods</div>
              <div style="margin-top:6px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#f5c2c2;">Authentic taste, delivered</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#3d0808;">${headline}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a433c;">${intro}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
                <tr>${digits}</tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#666;">This code expires in <strong>${env.otpTtlMinutes} minutes</strong>.</p>
              <p style="margin:0;font-size:13px;color:#888;">If you did not request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;border-top:1px solid #f0e7de;">
              <p style="margin:0;font-size:12px;color:#8a7f74;text-align:center;">
                Need help? Contact
                <a href="mailto:support@tirumalafoods.com" style="color:#900000;text-decoration:none;">support@tirumalafoods.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
}

export async function sendOtpEmail({ to, code, purpose = 'verification' }) {
  const transport = getTransporter()
  if (!transport) {
    return { sent: false, reason: 'smtp_not_configured' }
  }

  const { subject, text, html } = buildOtpEmail({ code, purpose })
  const from = resolveFromAddress()

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
      replyTo: 'support@tirumalafoods.com',
    })
  } catch (err) {
    console.error('[mailer] sendMail failed:', err.message)
    return {
      sent: false,
      reason: 'smtp_send_failed',
      detail: err.message,
    }
  }

  console.log(`[mailer] OTP email sent to ${to} from ${from}`)
  return { sent: true }
}
