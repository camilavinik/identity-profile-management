import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <span className="loading loading-ring loading-xl"></span>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
