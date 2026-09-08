import { query } from '../db/pool.js'
import { AppError, assertFound } from '../utils/errors.js'

function mapRole(row) {
  return {
    id: row.role_id,
    code: row.role_code,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    userCount: Number(row.user_count ?? 0),
    permissionCount: Number(row.permission_count ?? 0),
    permissions: row.permissions ?? undefined,
    createdAt: row.created_at_utc,
    updatedAt: row.updated_at_utc,
  }
}

export async function listRoles() {
  const result = await query(
    `SELECT r.role_id, r.role_code, r.name, r.description, r.is_active,
            r.created_at_utc, r.updated_at_utc,
            (
              SELECT COUNT(*)::int FROM user_roles ur
              WHERE ur.role_id = r.role_id AND ur.revoked_at_utc IS NULL
            ) AS user_count,
            (
              SELECT COUNT(*)::int FROM role_permissions rp
              WHERE rp.role_id = r.role_id
            ) AS permission_count
     FROM roles r
     ORDER BY r.role_code ASC`,
  )
  return result.rows.map(mapRole)
}

export async function getRoleById(roleId) {
  const result = await query(
    `SELECT r.role_id, r.role_code, r.name, r.description, r.is_active,
            r.created_at_utc, r.updated_at_utc,
            (
              SELECT COUNT(*)::int FROM user_roles ur
              WHERE ur.role_id = r.role_id AND ur.revoked_at_utc IS NULL
            ) AS user_count,
            (
              SELECT COUNT(*)::int FROM role_permissions rp
              WHERE rp.role_id = r.role_id
            ) AS permission_count
     FROM roles r
     WHERE r.role_id = $1`,
    [roleId],
  )
  const row = assertFound(result.rows[0], 'Role not found')
  const perms = await query(
    `SELECT p.permission_code, p.name
     FROM role_permissions rp
     JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE rp.role_id = $1 AND p.is_active = true
     ORDER BY p.permission_code ASC`,
    [roleId],
  )
  return {
    ...mapRole(row),
    permissions: perms.rows.map((p) => ({ code: p.permission_code, name: p.name })),
  }
}

export async function setRoleActive(roleId, active) {
  const existing = await query(`SELECT role_id, role_code FROM roles WHERE role_id = $1`, [roleId])
  const role = assertFound(existing.rows[0], 'Role not found')
  if (role.role_code === 'ADMIN' && !active) {
    throw new AppError('The ADMIN role cannot be deactivated.', 400)
  }
  await query(
    `UPDATE roles SET is_active = $2, updated_at_utc = NOW() WHERE role_id = $1`,
    [roleId, active],
  )
  return getRoleById(roleId)
}

export async function updateRole(roleId, body) {
  await getRoleById(roleId)
  const fields = []
  const params = []
  let i = 1
  if (body.name !== undefined) {
    fields.push(`name = $${i++}`)
    params.push(body.name)
  }
  if (body.description !== undefined) {
    fields.push(`description = $${i++}`)
    params.push(body.description)
  }
  if (!fields.length) return getRoleById(roleId)
  fields.push('updated_at_utc = NOW()')
  params.push(roleId)
  await query(`UPDATE roles SET ${fields.join(', ')} WHERE role_id = $${i}`, params)
  return getRoleById(roleId)
}

export async function listCustomers({ page = 1, pageSize = 20 } = {}) {
  const countResult = await query(
    `SELECT COUNT(DISTINCT u.user_id)::int AS total
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id AND ur.revoked_at_utc IS NULL
     JOIN roles r ON r.role_id = ur.role_id AND r.role_code = 'CUSTOMER'`,
  )
  const totalItems = countResult.rows[0].total
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const offset = (page - 1) * pageSize

  const result = await query(
    `SELECT u.user_id, u.email, u.user_status, u.account_status, u.created_at_utc,
            cp.first_name, cp.last_name, cp.phone
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id AND ur.revoked_at_utc IS NULL
     JOIN roles r ON r.role_id = ur.role_id AND r.role_code = 'CUSTOMER'
     LEFT JOIN customer_profiles cp ON cp.user_id = u.user_id
     GROUP BY u.user_id, cp.first_name, cp.last_name, cp.phone
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
      phone: row.phone ?? '',
      status: row.user_status,
      accountStatus: row.account_status,
      isActive: row.user_status === 'ACTIVE' && row.account_status === 'ACTIVE',
      createdAt: row.created_at_utc,
    })),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}
