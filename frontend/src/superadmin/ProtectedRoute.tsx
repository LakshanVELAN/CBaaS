import { Navigate } from 'react-router-dom';
import { isSuperAdminAuthenticated } from '../api';

export default function SuperAdminProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isSuperAdminAuthenticated()) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
}
