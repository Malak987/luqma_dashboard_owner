import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { decideAccess } from '../domain/session';
import { useSession } from '../session/context';

/**
 * Every protected route is rendered underneath this guard. Navigation
 * visibility is never treated as authorization.
 */
export function RequireAuth() {
  const { session, invalidateSession } = useSession();
  const location = useLocation();
  const decision = decideAccess(session);

  useEffect(() => {
    if (decision.kind === 'expired' || decision.kind === 'forbidden') {
      invalidateSession(decision.kind);
    }
  }, [decision.kind, invalidateSession]);

  if (decision.kind === 'login') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (decision.kind === 'expired') {
    return <Navigate to="/login?reason=expired" replace />;
  }

  if (decision.kind === 'forbidden') {
    return <Navigate to="/login?reason=forbidden" replace />;
  }

  return <Outlet />;
}
