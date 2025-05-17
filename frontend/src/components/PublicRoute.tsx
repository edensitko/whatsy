import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component that ensures the user is NOT authenticated
 * before allowing access to the wrapped route (login, register).
 * If user is already authenticated, they will be redirected to the dashboard.
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [shouldRender, setShouldRender] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  // Use effect to determine if we should render or redirect
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If user is authenticated, prepare to redirect
        const from = location.state?.from || '/dashboard';
        setRedirectPath(from);
        setShouldRedirect(true);
      } else {
        // Only render content when we're sure the user is not authenticated
        setShouldRender(true);
      }
    }
  }, [isAuthenticated, isLoading, location.state]);

  // Always show loading state first
  if (isLoading || (!shouldRender && !shouldRedirect)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard or the intended destination
  if (shouldRedirect) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if not authenticated and we've explicitly decided to render
  return <>{children}</>;
};

export default PublicRoute;
