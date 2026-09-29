import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function hasRole(user, role) {
  if (!user) return false;
  const roles = user.roles || [user.role].filter(Boolean);
  return roles.includes(role);
}

/**
 * Custom hook to enforce authenticated session state with real API verification.
 */
export function useAuthGuard(options = {}) {
  const { redirectTo, adminOnly = false, superOnly = false, anyRole = null } = options;
  const { user, ready, refresh } = useAuth();
  const location = useLocation();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (ready && user) {
      setVerifying(true);
      refresh()
        .catch(() => {
          if (isMounted) {
            toast.error("Sesi tidak valid, mengalihkan ke halaman publik.");
          }
        })
        .finally(() => {
          if (isMounted) setVerifying(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const isAuthenticated = ready && !!user;
  const isAuthorized =
    isAuthenticated &&
    (!superOnly || hasRole(user, "super_admin")) &&
    (!adminOnly || hasRole(user, "admin") || hasRole(user, "super_admin")) &&
    (!anyRole || (Array.isArray(anyRole) && anyRole.some((r) => hasRole(user, r))));

  return {
    user,
    ready: ready && !verifying,
    isAuthenticated,
    isAuthorized,
    redirectTo: redirectTo || (location.pathname.startsWith("/admin") || location.pathname.startsWith("/super") ? "/admin/login" : "/login"),
  };
}

/**
 * AuthGuard component wrapper protecting private routes via real API session verification.
 */
export function AuthGuard({ children, adminOnly = false, superOnly = false, anyRole = null, redirectTo = null }) {
  const { user, ready, isAuthorized, redirectTo: computedRedirect } = useAuthGuard({
    redirectTo,
    adminOnly,
    superOnly,
    anyRole,
  });
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs font-mono font-semibold text-muted-foreground animate-pulse">
          Memverifikasi Sesi Keamanan...
        </div>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    const target = computedRedirect || "/";
    return (
      <Navigate
        to={`${target}?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return children;
}

export default AuthGuard;
