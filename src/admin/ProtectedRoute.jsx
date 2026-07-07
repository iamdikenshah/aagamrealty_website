import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Gate for admin routes: shows a brief loading state while Firebase resolves the
 * session, redirects to /admin/login when signed out, and renders the protected
 * children once an admin is authenticated. Write access is additionally enforced
 * server-side by firestore.rules / storage.rules (admin custom claim).
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-splash">
        <div className="admin-spinner" aria-hidden="true" />
        <p>Checking your session…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
