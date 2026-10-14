/** Prefer app_metadata (service-role only); fall back to legacy user_metadata. */
export function getUserRole(user) {
  if (!user) return 'customer';
  return (
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    user.role ||
    'customer'
  );
}

export function isAdmin(user) {
  return getUserRole(user) === 'admin';
}

export function isStaff(user) {
  const role = getUserRole(user);
  return role === 'admin' || role === 'manager';
}

export const STAFF_ROLES = ['admin', 'manager'];
export const ALL_ROLES = ['admin', 'manager', 'customer'];
