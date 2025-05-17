import { Request, Response, NextFunction } from 'express';
import { auth, adminAuth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Note: We're using the existing Request interface defined in src/types/express.d.ts
// which already has the user property with uid, email, and [key: string]: any

/**
 * Verify a Firebase ID token
 */
export const verifyIdToken = async (token: string): Promise<DecodedIdToken> => {
  if (!adminAuth) {
    // Mock verification for development without Admin SDK
    console.log('Using mock token verification (Admin SDK not available)');
    // Simple mock implementation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    try {
      // Basic JWT parsing
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      // Cast to unknown first to avoid TypeScript errors
      return {
        uid: payload.sub || payload.user_id || 'mock-user-id',
        email: payload.email,
        name: payload.name,
        iat: payload.iat || Math.floor(Date.now() / 1000),
        exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
        auth_time: payload.auth_time || Math.floor(Date.now() / 1000),
        sub: payload.sub || payload.user_id || 'mock-user-id',
        // Add required properties for DecodedIdToken
        aud: 'mock-project-id',
        firebase: { sign_in_provider: 'custom' },
        iss: `https://securetoken.google.com/mock-project-id`
      } as unknown as DecodedIdToken;
    } catch (error) {
      console.error('Error parsing mock token:', error);
      throw new Error('Invalid token');
    }
  }
  
  // Use Firebase Admin SDK for verification
  return await adminAuth.verifyIdToken(token);
};

/**
 * Middleware to authenticate requests using Firebase Auth tokens
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    // In development mode, allow requests without a token
    if (!token) {
      if (isDevelopment) {
        console.log('Development mode: Proceeding without authentication token');
        // Set a mock user for development
        (req as any).user = {
          uid: 'dev-user-123',
          email: 'dev@example.com',
          displayName: 'Development User'
        };
        return next();
      } else {
        return res.status(401).json({ error: 'No authentication token provided' });
      }
    }
    
    try {
      // Verify the token
      const decodedToken = await verifyIdToken(token);
      
      if (!decodedToken || !decodedToken.uid) {
        // In development mode, proceed with a mock user even if token verification fails
        if (isDevelopment) {
          console.log('Development mode: Proceeding with mock user after token verification failure');
          (req as any).user = {
            uid: 'dev-user-123',
            email: 'dev@example.com',
            displayName: 'Development User'
          };
          return next();
        } else {
          return res.status(403).json({ error: 'Invalid token payload' });
        }
      }
      
      // Set the user on the request object
      // Use type assertion to bypass TypeScript error
      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.displayName
      };
      
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      
      // In development mode, proceed with a mock user even if token verification fails
      if (isDevelopment) {
        console.log('Development mode: Proceeding with mock user after token verification error');
        (req as any).user = {
          uid: 'dev-user-123',
          email: 'dev@example.com',
          displayName: 'Development User'
        };
        return next();
      } else {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    // In development mode, proceed with a mock user even if there's an authentication error
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Proceeding with mock user after authentication error');
      (req as any).user = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        displayName: 'Development User'
      };
      return next();
    } else {
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
};
