import { query } from '../db/pool.js'

export async function getUserPermissions(userId) {
  const result = await query(
    `SELECT DISTINCT p.permission_code
     FROM user_roles ur
     JOIN roles r ON r.role_id = ur.role_id AND r.is_active = true
     JOIN role_permissions rp ON rp.role_id = r.role_id
     JOIN permissions p ON p.permission_id = rp.permission_id AND p.is_active = true
     WHERE ur.user_id = $1 AND ur.revoked_at_utc IS NULL`,
    [userId],
  )
  return result.rows.map((row) => row.permission_code)
}

export function hasPermission(permissions, code) {
  return permissions.includes(code)
}

export function hasAnyPermission(permissions, codes) {
  return codes.some((code) => permissions.includes(code))
}
