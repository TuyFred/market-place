import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readStoredToken } from '../../utils/session';

type Props = {
  children: React.ReactNode;
  /** If set, user.role must be one of these */
  roles?: Array<'admin' | 'manager' | 'customer'>;
};

/**
 * Blocks protected pages when there is no live session.
 * Uses replace so the blocked URL is not left in history for Back.
 */
export function RequireAuth({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const hasToken = Boolean(readStoredToken());

  if (!isAuthenticated || !hasToken) {
    return (
      <Navigate
        to="/"
        replace
        state={{ needLogin: true, from: location.pathname, authMessage: 'Please sign in to continue.' }}
      />
    );
  }

  if (roles && user && !roles.includes(user.role as 'admin' | 'manager' | 'customer')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
