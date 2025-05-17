import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  isLoggedIn, 
  getCurrentUser, 
  validateToken, 
  loginUser, 
  logoutUser, 
  registerUser,
  AuthUser,
  auth,
  onAuthStateChanged,
  onIdTokenChanged
} from '@/services/authService';

// Define the shape of our auth context
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  refreshAuthState: async () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to refresh the auth state
  const refreshAuthState = async () => {
    try {
      setIsLoading(true);
      
      // First check Firebase's current user
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        // Firebase says we're logged in, force token refresh
        try {
          // Force token refresh to ensure we have a valid token
          const token = await firebaseUser.getIdToken(true);
          
          // Get or create user data
          let currentUser = getCurrentUser();
          
          if (!currentUser) {
            // If we don't have user data in localStorage but Firebase says we're logged in,
            // create user data from Firebase user
            currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              businesses: []
            };
            
            // Store the user data and token
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(currentUser));
          }
          
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('User authenticated via Firebase current user');
          return;
        } catch (tokenError) {
          console.error('Error refreshing token:', tokenError);
        }
      }
      
      // If Firebase check failed, fall back to localStorage check
      const loggedIn = isLoggedIn();
      
      if (loggedIn) {
        // Get current user from local storage
        const currentUser = getCurrentUser();
        
        // בדיקת תוקף הטוקן - אם יש לנו משתמש בלוקל סטורג', נניח שהוא תקף
        // אלא אם כן יש לנו חיבור לשרת
        let isValid = true;
        
        try {
          // נסה לאמת את הטוקן רק אם יש חיבור לשרת - השתמש בפרוקסי כדי למנוע בעיות CORS
          try {
            const response = await fetch('/api/health', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              console.log('Health check successful, validating token');
              isValid = await validateToken();
              console.log('Token validation result:', isValid);
            } else {
              console.log('Health check failed with status:', response.status);
              console.log('Server not connected, assuming token is valid');
            }
          } catch (connectionError) {
            console.log('Health check connection error:', connectionError);
            console.log('Server not connected, assuming token is valid');
          }
        } catch (error) {
          console.log('Error checking token validity, assuming valid:', error);
        }
        
        if (isValid && currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('User authenticated via localStorage token');
        } else {
          // Token is invalid, clear state
          setUser(null);
          setIsAuthenticated(false);
          // We don't logout here as that would clear local storage
          // and we want to preserve the attempted login for debugging
          console.warn('Auth token is invalid or expired');
        }
      } else {
        // Not logged in
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await loginUser(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      logoutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Register function
  const register = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const response = await registerUser(email, password, displayName);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    // Initial auth state check
    refreshAuthState();
    
    // Set up a listener for Firebase auth state changes
    const unsubscribeAuthState = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? 'logged in' : 'logged out');
      if (firebaseUser) {
        // User is signed in
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });
    
    // Set up a listener for Firebase token changes
    const unsubscribeTokenChange = onIdTokenChanged(auth, async (firebaseUser) => {
      console.log('Firebase token changed:', firebaseUser ? 'token refreshed' : 'no token');
      if (firebaseUser) {
        // Token refreshed
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      }
    });
    
    // Set up a listener for storage events to sync auth state across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_token' || event.key === 'auth_user') {
        refreshAuthState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up periodic token validation (every 10 minutes)
    const tokenValidationInterval = setInterval(() => {
      if (isAuthenticated) {
        console.log('Performing periodic token validation');
        refreshAuthState();
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    // Clean up all listeners on unmount
    return () => {
      unsubscribeAuthState();
      unsubscribeTokenChange();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenValidationInterval);
    };
  }, [isAuthenticated]);

  // Provide the auth context to children
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout, 
        register,
        refreshAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
