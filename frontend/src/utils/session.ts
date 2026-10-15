/** Auth storage keys used across the shop */
export const AUTH_STORAGE_KEYS = [
  'customer_token',
  'customer_user',
  'admin_token',
  'admin_user',
  'demo_mode',
] as const;

export function clearAuthStorage() {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  } catch {
    return null;
  }
}

export function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/customer') ||
    pathname === '/customer/dashboard'
  );
}

/**
 * Hard navigation that replaces the current history entry so the browser
 * back button cannot reopen a logged-in page after sign-out.
 */
export function hardRedirectHome(reason: 'signedOut' | 'sessionExpired' = 'signedOut') {
  const url = `/?auth=${reason}`;
  window.location.replace(url);
}
