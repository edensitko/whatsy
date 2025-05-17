import express from 'express';
import { registerUser, loginUser, } from '../services/authService';
import { db, adminAuth } from '../config/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { mockRegisterUser, mockLoginUser, mockVerifyToken } from '../services/mockAuthService';

const router = express.Router();

// User collection reference
const usersCollection = collection(db, 'users');

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if we should use mock authentication
    if (!adminAuth) {
      console.log('Using mock authentication for registration (Admin SDK not available)');
      try {
        const { user, token } = mockRegisterUser(email, password, displayName);
        return res.status(201).json({ user, token });
      } catch (mockError: any) {
        return res.status(400).json({ error: mockError.message });
      }
    }
    
    // Register the user with Firebase Auth
    const userCredential = await registerUser(email, password);
    const uid = userCredential.user.uid;
    
    // Create a user document in Firestore
    const userDoc = doc(usersCollection, uid);
    await setDoc(userDoc, {
      uid,
      email,
      displayName: displayName || '',
      businesses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Generate a custom token for the client
    const customToken = await createCustomToken(uid);
    
    // Return user info and token
    return res.status(201).json({
      user: {
        uid,
        email,
        displayName: displayName || '',
        businesses: []
      },
      token: customToken
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Firebase Auth specific errors
    if (error.code === 'auth/email-already-in-use') {
      return res.status(400).json({ error: 'Email already in use' });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    return res.status(500).json({ error: 'Registration failed: ' + (error.message || 'Unknown error') });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if we should use mock authentication
    if (!adminAuth) {
      console.log('Using mock authentication for login (Admin SDK not available)');
      try {
        const { user, token } = mockLoginUser(email, password);
        return res.status(200).json({ user, token });
      } catch (mockError: any) {
        return res.status(401).json({ error: mockError.message });
      }
    }
    
    // Login the user with Firebase Auth
    const userCredential = await loginUser(email, password);
    const uid = userCredential.user.uid;
    
    // Get user data from Firestore
    const userDoc = doc(usersCollection, uid);
    const userSnapshot = await getDoc(userDoc);
    
    let userData = {
      uid,
      email,
      displayName: userCredential.user.displayName || '',
      businesses: []
    };
    
    // If user document exists, use that data
    if (userSnapshot.exists()) {
      const userDataFromFirestore = userSnapshot.data();
      userData = {
        ...userData,
        displayName: userDataFromFirestore.displayName || userData.displayName,
        businesses: userDataFromFirestore.businesses || []
      };
    }
    
    // Generate a custom token for the client
    const customToken = await createCustomToken(uid);
    
    // Return user info and token
    return res.status(200).json({
      user: userData,
      token: customToken
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle Firebase Auth specific errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    } else if (error.code === 'auth/too-many-requests') {
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }
    
    return res.status(500).json({ error: 'Login failed: ' + (error.message || 'Unknown error') });
  }
});

// Validate token endpoint
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Check if we should use mock authentication
    if (!adminAuth) {
      console.log('Using mock token validation (Admin SDK not available)');
      const user = mockVerifyToken(token);
      return res.status(200).json({ valid: !!user });
    }
    
    // The token validation is handled by the authMiddleware
    // If we reach here, the token is valid
    return res.status(200).json({ valid: true });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'Token validation failed' });
  }
});

// Check auth status endpoint
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ authenticated: false });
    }
    
    // The actual token verification is done in the authMiddleware
    // This endpoint just confirms the token is present
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error('Auth status check error:', error);
    return res.status(500).json({ error: 'Auth status check failed' });
  }
});

export const authRouter = router;
function createCustomToken(uid: string) {
  throw new Error('Function not implemented.');
}

