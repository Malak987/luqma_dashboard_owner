import { Navigate, useLocation } from 'react-router-dom';
import { decideAccess, safeReturnPath } from '../domain/session';
import { useSession } from '../session/context';
import LoginPage from '../LoginPage';

export function LoginRoute() {
  const { session } = useSession();
  const location = useLocation();
  const decision = decideAccess(session);

  if (session && decision.kind === 'allow') {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={safeReturnPath(from)} replace />;
  }

  return <LoginPage />;
}
