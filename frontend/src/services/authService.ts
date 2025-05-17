/**
 * Authentication service for handling user registration, login, and session management
 * Uses Firebase Authentication
 */

// import { apiRequest } from './apiService';

// // Store auth token in localStorage
// const TOKEN_KEY = 'auth_token';
// const USER_KEY = 'auth_user';

// // User interface
// export interface AuthUser {
//   uid: string;
//   email: string;
//   displayName?: string;
//   photoURL?: string;
//   businesses?: string[];
// }

// // Login response interface
// interface LoginResponse {
//   user: AuthUser;
//   token: string;
// }

// // Token validation response interface
// interface TokenValidationResponse {
//   valid: boolean;
//   user?: AuthUser;
//   error?: string;
// }

// /**
//  * Register a new user
//  * @param email User email
//  * @param password User password
//  * @param displayName Optional display name
//  * @returns Promise resolving to the user data and token
//  */
// export const registerUser = async (
//   email: string,
//   password: string,
//   displayName?: string
// ): Promise<LoginResponse> => {
//   try {
//     const response = await apiRequest<LoginResponse>(
//       '/api/auth/register',
//       'POST',
//       { email, password, displayName }
//     );
    
//     // Save token and user data to localStorage
//     localStorage.setItem(TOKEN_KEY, response.token);
//     localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
//     return response;
//   } catch (error: any) {
//     console.error('Registration error:', error);
//     throw new Error(error.message || 'Registration failed');
//   }
// };

// /**
//  * Login an existing user
//  * @param email User email
//  * @param password User password
//  * @returns Promise resolving to the user data and token
//  */
// export const loginUser = async (
//   email: string,
//   password: string
// ): Promise<LoginResponse> => {
//   try {
//     const response = await apiRequest<LoginResponse>(
//       '/api/auth/login',
//       'POST',
//       { email, password }
//     );
    
//     // Save token and user data to localStorage
//     localStorage.setItem(TOKEN_KEY, response.token);
//     localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
//     return response;
//   } catch (error: any) {
//     console.error('Login error:', error);
//     throw new Error(error.message || 'Login failed');
//   }
// };

// /**
//  * Logout the current user
//  */
// export const logoutUser = async (): Promise<void> => {
//   try {
//     // Call the backend logout endpoint
//     await apiRequest('/api/auth/logout', 'POST');
//   } catch (error) {
//     console.error('Logout error:', error);
//   } finally {
//     // Always clear local storage regardless of API call success
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//   }
// };

// /**
//  * Check if a user is currently logged in
//  * @returns Boolean indicating if a user is logged in
//  */
// export const isLoggedIn = (): boolean => {
//   return localStorage.getItem(TOKEN_KEY) !== null;
// };

// /**
//  * Get the current authentication token
//  * @returns The current token or null if not logged in
//  */
// export const getToken = (): string | null => {
//   return localStorage.getItem(TOKEN_KEY);
// };

// /**
//  * Get the current user data
//  * @returns The current user data or null if not logged in
//  */
// export const getCurrentUser = (): AuthUser | null => {
//   const userData = localStorage.getItem(USER_KEY);
//   if (!userData) return null;
  
//   try {
//     return JSON.parse(userData) as AuthUser;
//   } catch (error) {
//     console.error('Error parsing user data:', error);
//     return null;
//   }
// };

// This section was moved to the end of the file to avoid duplicates

// /**
//  * Check if the current auth token is valid
//  * @returns Promise resolving to a boolean indicating if the token is valid
//  */
// export const validateToken = async (): Promise<boolean> => {
//   const token = getToken();
//   if (!token) return false;
  
//   try {
//     const response = await apiRequest<TokenValidationResponse>(
//       '/api/auth/validate-token',
//       'POST',
//       { token }
//     );
    
//     if (!response.valid) {
//       // Clear invalid token
//       localStorage.removeItem(TOKEN_KEY);
//       localStorage.removeItem(USER_KEY);
//       return false;
//     }
    
//     // Update user data if provided
//     if (response.user) {
//       localStorage.setItem(USER_KEY, JSON.stringify(response.user));
//     }
    
//     return true;
//   } catch (error) {
//     console.error('Token validation error:', error);
//     // Clear token on validation error
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//     return false;
//   }
// };

// // Initialize auth service - validate token on load
// (async function initializeAuthService() {
//   if (isLoggedIn()) {
//     try {
//       await validateToken();
//     } catch (error) {
//       console.error('Error validating token on initialization:', error);
//     }
//   }
// })();
//     // Check if we have a current token on initialization
//     const token = localStorage.getItem(TOKEN_KEY);
//     if (token) {
//       console.log('Found existing auth token on initialization');
//       // Validate token with backend API
//       const validationResponse = await apiRequest('POST', '/auth/validate-token', { token });
//       if (validationResponse.valid) {
//         console.log('Token is valid');
//         // Get user data from backend API
//         const userResponse = await apiRequest('GET', '/auth/user');
//         const userData: AuthUser = userResponse.user;
//         localStorage.setItem(USER_KEY, JSON.stringify(userData));
//       } else {
//         console.log('Token is invalid');
//         localStorage.removeItem(TOKEN_KEY);
//         localStorage.removeItem(USER_KEY);
//       // Force token refresh to ensure we have a valid token
//       try {
//         const token = await currentUser.getIdToken(true);
//         localStorage.setItem(TOKEN_KEY, token);
        
//         // Make sure we have user data in localStorage
//         if (!localStorage.getItem(USER_KEY)) {
//           const userData: AuthUser = {
//             uid: currentUser.uid,
//             email: currentUser.email || '',
//             displayName: currentUser.displayName || '',
//             photoURL: currentUser.photoURL || '',
//             businesses: []
//           };
//           localStorage.setItem(USER_KEY, JSON.stringify(userData));
//         }
//       } catch (tokenError) {
//         console.error('Error refreshing token during initialization:', tokenError);
//       }
//     }
//   } catch (error) {
//     console.error('Error setting auth persistence:', error);
//   }
// })();

// /**
//  * Register a new user
//  * @param email User email
//  * @param password User password
//  * @param displayName Optional display name
//  * @returns Promise resolving to the user data and token
//  */
// export async function registerUser(
//   email: string, 
//   password: string, 
//   displayName?: string
// ): Promise<LoginResponse> {
//   try {
//     // Create user with Firebase Authentication
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
    
//     // Create user document in Firestore
//     const userData: AuthUser = {
//       uid: user.uid,
//       email: user.email || email,
//       displayName: displayName || user.displayName || '',
//       photoURL: user.photoURL || '',
//       businesses: []
//     };
    
//     // Save user data to Firestore
//     await setDoc(doc(db, 'users', user.uid), {
//       ...userData,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });

//     // Get token
//     const token = await user.getIdToken();

//     // Store auth data locally
//     localStorage.setItem(TOKEN_KEY, token);
//     localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
//     return {
//       user: userData,
//       token
//     };
//   } catch (error: any) {
//     console.error('Registration error:', error);
    
//     // Provide more user-friendly error messages
//     if (error.code === 'auth/email-already-in-use') {
//       throw new Error('This email is already registered. Please use a different email or try logging in.');
//     } else if (error.code === 'auth/weak-password') {
//       throw new Error('Password is too weak. Please use a stronger password.');
//     } else if (error.code === 'auth/invalid-email') {
//       throw new Error('Invalid email format. Please provide a valid email address.');
//     }
    
//     throw error;
//   }
// }

// /**
//  * Login an existing user
//  * @param email User email
//  * @param password User password
//  * @returns Promise resolving to the user data and token
//  */
// export async function loginUser(email: string, password: string): Promise<LoginResponse> {
//   try {
//     // Sign in with Firebase Authentication - persistence is already set to LOCAL
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
    
//     // Force token refresh to ensure we have the latest token
//     await user.getIdToken(true);
    
//     // Get user data from Firestore
//     const userDocRef = doc(db, 'users', user.uid);
//     const userDoc = await getDoc(userDocRef);
    
//     let userData: AuthUser = {
//       uid: user.uid,
//       email: user.email || email,
//       displayName: user.displayName || '',
//       photoURL: user.photoURL || '',
//       businesses: []
//     };
    
//     // If user document exists in Firestore, use that data
//     if (userDoc.exists()) {
//       const firestoreData = userDoc.data() as AuthUser;
//       userData = {
//         ...userData,
//         displayName: firestoreData.displayName || userData.displayName,
//         photoURL: firestoreData.photoURL || userData.photoURL,
//         businesses: firestoreData.businesses || []
//       };
//     } else {
//       // Create user document if it doesn't exist
//       await setDoc(userDocRef, {
//         ...userData,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
//     }
    
//     // Get token
//     const token = await user.getIdToken();
    
//     // Store auth data locally
//     localStorage.setItem(TOKEN_KEY, token);
//     localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
//     return {
//       user: userData,
//       token
//     };
//   } catch (error: any) {
//     console.error('Login error:', error);
    
//     // Provide more user-friendly error messages
//     if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
//       throw new Error('Invalid email or password. Please try again.');
//     } else if (error.code === 'auth/too-many-requests') {
//       throw new Error('Too many failed login attempts. Please try again later or reset your password.');
//     }
    
//     throw error;
//   }
// }

// /**
//  * Logout the current user
//  */
// export function logoutUser(): void {
//   signOut(auth).then(() => {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//   }).catch((error) => {
//     console.error('Logout error:', error);
//   });
// }

// /**
//  * Check if a user is currently logged in
//  * @returns Boolean indicating if a user is logged in
//  */
// export function isLoggedIn(): boolean {
//   return !!getToken();
// }

// /**
//  * Get the current authentication token
//  * @returns The current token or null if not logged in
//  */
// export function getToken(): string | null {
//   return localStorage.getItem(TOKEN_KEY);
// }

// /**
//  * Get the current user data
//  * @returns The current user data or null if not logged in
//  */
// export function getCurrentUser(): AuthUser | null {
//   const userJson = localStorage.getItem(USER_KEY);
//   if (!userJson) {
//     return null;
//   }
  
//   try {
//     return JSON.parse(userJson);
//   } catch (error) {
//     console.error('Error parsing user data:', error);
//     return null;
//   }
// }

// /**
//  * Get auth headers for API requests
//  * @returns Headers object with Authorization token
//  */
// export function getAuthHeaders(): HeadersInit {
//   const token = getToken();
//   if (!token) {
//     return {};
//   }
  
//   return {
//     'Authorization': `Bearer ${token}`
//   };
// }

// /**
//  * Update user profile photo
//  * @param photoURL URL of the profile photo
//  * @returns Promise resolving to the updated user data
//  */
// export async function updateProfilePhoto(photoURL: string): Promise<AuthUser | null> {
//   try {
//     const currentUser = getCurrentUser();
//     if (!currentUser) {
//       throw new Error('No user is currently logged in');
//     }

//     // Update user data in local storage
//     const updatedUser: AuthUser = {
//       ...currentUser,
//       photoURL
//     };

//     // Store updated user data locally
//     localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

//     // Update user data in Firestore
//     const userDocRef = doc(db, 'users', currentUser.uid);
//     await setDoc(userDocRef, {
//       ...updatedUser,
//       updatedAt: new Date()
//     }, { merge: true });

//     return updatedUser;
//   } catch (error) {
//     console.error('Error updating profile photo:', error);
//     throw error;
//   }
// }

// /**
//  * Check if the current auth token is valid
//  * @returns Promise resolving to a boolean indicating if the token is valid
//  */
// export async function validateToken(): Promise<boolean> {
//   const token = getToken();
//   if (!token) {
//     return false;
//   }
  
//   try {
//     // For Firebase, we can check if the current user is still authenticated
//     const currentUser = auth.currentUser;
//     if (!currentUser) {
//       // If Firebase says we're not logged in but we have a token,
//       // try to reauthenticate using the token
//       try {
//         // This is a simplified check - in a real app, you might want to
//         // validate the token with your backend
//         console.log('No Firebase user but token exists, attempting to validate token');
//         return true; // Assume token is valid if it exists
//       } catch (innerError) {
//         console.error('Token validation inner error:', innerError);
//         return false;
//       }
//     }
    
//     // Try to refresh the token to verify it's still valid
//     await currentUser.getIdToken(true);
//     return true;
//   } catch (error) {
//     console.error('Token validation error:', error);
//     return false;
//   }
// }

// // Listen for auth state changes - this fires on login/logout events
// onAuthStateChanged(auth, async (user) => {
//   if (user) {
//     try {
//       // User is signed in
//       const token = await user.getIdToken();
      
//       // Get user data from Firestore
//       const userDocRef = doc(db, 'users', user.uid);
//       const userDoc = await getDoc(userDocRef);
      
//       let userData: AuthUser = {
//         uid: user.uid,
//         email: user.email || '',
//         displayName: user.displayName || '',
//         businesses: []
//       };
      
//       // If user document exists in Firestore, use that data
//       if (userDoc.exists()) {
//         const firestoreData = userDoc.data() as AuthUser;
//         userData = {
//           ...userData,
//           displayName: firestoreData.displayName || userData.displayName,
//           businesses: firestoreData.businesses || []
//         };
//       }
      
//       // Update local storage
//       localStorage.setItem(TOKEN_KEY, token);
//       localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
//       console.log('User authenticated:', userData.email);
//     } catch (error) {
//       console.error('Error updating auth state:', error);
//     }
//   } else {
//     // User is signed out
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//     console.log('User signed out');
//   }
// });

// // Listen for ID token changes - this fires when the token is refreshed
// onIdTokenChanged(auth, async (user) => {
//   if (user) {
//     try {
//       // Get the new token
//       const token = await user.getIdToken();
//       // Update token in local storage
//       localStorage.setItem(TOKEN_KEY, token);
//       console.log('Auth token refreshed');
//     } catch (error) {
//       console.error('Error refreshing token:', error);
//     }
//   }
// });

// // Set up token refresh interval (every 50 minutes)
// // Firebase tokens expire after 1 hour, so we refresh before expiration
// setInterval(async () => {
//   const currentUser = auth.currentUser;
//   if (currentUser) {
//     try {
//       // Force token refresh
//       const token = await currentUser.getIdToken(true);
//       localStorage.setItem(TOKEN_KEY, token);
//       console.log('Auth token proactively refreshed');
//     } catch (error) {
//       console.error('Error during scheduled token refresh:', error);
//     }
//   }
// }, 50 * 60 * 1000); // 50 minutes
/**
 * Authentication service for handling user registration, login, and session management
 * Uses the backend API instead of direct Firebase calls
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged
} from 'firebase/auth';
import { apiRequest } from './apiService';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase if not already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If Firebase is already initialized, get the existing app
  console.log('Firebase already initialized');
}

// Get Firebase Auth instance for AuthContext compatibility
export const auth = getAuth();

// Export Firebase auth state change functions
export const onAuthStateChanged = _onAuthStateChanged;
export const onIdTokenChanged = _onIdTokenChanged;

// Store auth token in localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// User interface
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  businesses?: string[];
}

// Login response interface
interface LoginResponse {
  user: AuthUser;
  token: string;
}

// Token validation response interface
interface TokenValidationResponse {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param displayName Optional display name
 * @returns Promise resolving to the user data and token
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<LoginResponse> => {
  try {
    const response = await apiRequest<LoginResponse>(
      '/auth/register',
      'POST',
      { email, password, displayName }
    );
    
    // Save token and user data to localStorage
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Login an existing user
 * @param email User email
 * @param password User password
 * @returns Promise resolving to the user data and token
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await apiRequest<LoginResponse>(
      '/auth/login',
      'POST',
      { email, password }
    );
    
    // Save token and user data to localStorage
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Logout the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Call the backend logout endpoint
    await apiRequest('/auth/logout', 'POST');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage regardless of API call success
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Check if a user is currently logged in
 * @returns Boolean indicating if a user is logged in
 */
export const isLoggedIn = (): boolean => {
  return localStorage.getItem(TOKEN_KEY) !== null;
};

/**
 * Get the current authentication token
 * @returns The current token or null if not logged in
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the current user data
 * @returns The current user data or null if not logged in
 */
export const getCurrentUser = (): AuthUser | null => {
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as AuthUser;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get auth headers for API requests
 * @returns Headers object with Authorization token
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Update user profile
 * @param data Profile data to update
 * @returns Promise resolving to the updated user data
 */
export const updateProfile = async (data: Partial<AuthUser>): Promise<AuthUser> => {
  try {
    const response = await apiRequest<{user: AuthUser}>(
      '/auth/profile',
      'PUT',
      data
    );
    
    // Update user data in localStorage
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.user };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Profile update error:', error);
    throw new Error(error.message || 'Profile update failed');
  }
};

/**
 * Update user profile photo
 * @param photoURL URL of the profile photo
 * @returns Promise resolving to the updated user data
 */
export const updateProfilePhoto = async (photoURL: string): Promise<AuthUser | null> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }

    // Update user profile with new photo URL
    return await updateProfile({ photoURL });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    throw error;
  }
};

/**
 * Check if the current auth token is valid
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
export const validateToken = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const response = await apiRequest<TokenValidationResponse>(
      '/auth/validate-token',
      'POST',
      { token }
    );
    
    if (!response.valid) {
      // Clear invalid token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    
    // Update user data if provided
    if (response.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    // Clear token on validation error
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

// Initialize auth service - validate token on load
(async function initializeAuthService() {
  if (isLoggedIn()) {
    try {
      await validateToken();
    } catch (error) {
      console.error('Error validating token on initialization:', error);
    }
  }
})();