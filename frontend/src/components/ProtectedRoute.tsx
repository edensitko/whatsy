import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that ensures the user is authenticated
 * before allowing access to the wrapped route.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [shouldRender, setShouldRender] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Use effect to determine if we should render or redirect
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Only render content when we're sure the user is authenticated
        setShouldRender(true);
      } else {
        // Only redirect when we're sure the user is not authenticated
        setShouldRedirect(true);
      }
    }
  }, [isAuthenticated, isLoading]);

  // Always show loading state first
  if (isLoading || (!shouldRender && !shouldRedirect)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (shouldRedirect) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Render children if authenticated and we've explicitly decided to render
  return <>{children}</>;
};

export default ProtectedRoute;
