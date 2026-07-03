import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { isMockApi } from "../api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  // No backend/Cognito pool exists yet while running against the mock API, so there's
  // no way to sign in - let dev traffic through rather than dead-ending the whole app.
  // Once VITE_API_BASE_URL points at a real backend this gate is fully enforced.
  if (!isAuthenticated && !isMockApi) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
