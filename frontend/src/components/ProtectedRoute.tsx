import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { tenant, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!tenant) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
