import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "laborer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Check localStorage as fallback during loading to handle race conditions
  const storedUser = !isLoading && !user ? localStorage.getItem("user") : null;
  const effectiveUser = user || (storedUser ? JSON.parse(storedUser) : null);

  useEffect(() => {
    if (!isLoading && !effectiveUser) {
      setLocation("/auth/signin");
    } else if (!isLoading && requiredRole && effectiveUser?.role !== requiredRole) {
      // Redirect to appropriate dashboard if wrong role
      setLocation(effectiveUser?.role === "customer" ? "/dashboard/customer" : "/dashboard/laborer");
    }
  }, [effectiveUser, isLoading, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!effectiveUser || (requiredRole && effectiveUser.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
