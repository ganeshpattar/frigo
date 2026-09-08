-- Manager: view customers only (no customer.update)
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.role_id
  AND rp.permission_id = p.permission_id
  AND r.role_code = 'MANAGER'
  AND p.permission_code = 'customer.update';
