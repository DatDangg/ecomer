import { Navigate, Outlet, useLocation } from "react-router-dom";

import {
  selectCanSell,
  selectIsAdmin,
  selectIsAuthenticated,
  useAuthStore,
} from "@/stores/auth.store";

export function PrivateRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isAdmin = useAuthStore(selectIsAdmin);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function SellerRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const canSell = useAuthStore(selectCanSell);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canSell) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
