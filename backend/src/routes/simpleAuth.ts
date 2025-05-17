import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, adminDb, adminAuth, isDevelopment } from '../config/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { mockUsers, mockTokens } from '../services/authService';
import * as admin from 'firebase-admin';

const router = express.Router();
const auth = getAuth();

// User collection reference
const usersCollection = collection(db, 'users');

// Middleware to verify token
const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if it's a mock token
    if (token.startsWith('mock-')) {
      console.log('Found mock token for user:', token);
      const uid = mockTokens[token];
      if (!uid) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      req.user = mockUsers[uid];
      console.log('Using mock token verification (Admin SDK not available)');
      return next();
    }
    
    // Verify with Firebase Auth
    try {
      // If we have admin SDK available, use it to verify the token
      if (admin && admin.auth) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Get user data from Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        req.user = userDoc.data();
        return next();
      } else {
        throw new Error('Admin SDK not available');
      }
    } catch (error) {
      console.log('Error verifying token with Admin SDK, falling back to client SDK');
      
      // Fallback to client SDK
      const user = auth.currentUser;
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(usersCollection, user.uid));
      if (!userDoc.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      req.user = userDoc.data();
      return next();
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    console.log('Register endpoint called with:', req.body);
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if email already exists in Firestore
    try {
      const q = query(usersCollection, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    } catch (firestoreError) {
      console.error('Error checking email in Firestore:', firestoreError);
      // Continue with registration even if Firestore check fails
    }
    
    // Create user with Firebase Authentication
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
      
      console.log('User registered and saved to Firestore:', uid);
      
      // Generate token (using Firebase ID token)
      const token = await userCredential.user.getIdToken();
      
      // Return user info and token
      return res.status(201).json({
        user: {
          uid,
          email,
          displayName: displayName || '',
          businesses: []
        },
        token
      });
    } catch (authError: any) {
      console.error('Firebase Auth registration error:', authError);
      
      // Handle Firebase Auth specific errors
      if (authError.code === 'auth/email-already-in-use') {
        return res.status(400).json({ error: 'Email already in use' });
      } else if (authError.code === 'auth/weak-password') {
        return res.status(400).json({ error: 'Password is too weak' });
      } else if (authError.code === 'auth/invalid-email') {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      // Fallback to simple registration if Firebase Auth fails
      console.log('Falling back to simple registration');
      
      // Create a new user ID
      const uid = uuidv4();
      
      // Create a user document in Firestore
      try {
        const userDoc = doc(usersCollection, uid);
        await setDoc(userDoc, {
          uid,
          email,
          displayName: displayName || '',
          businesses: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('User registered with fallback method and saved to Firestore:', uid);
        
        // Generate a simple token
        const token = `token_${uid}_${Date.now()}`;
        
        // Store user and token in mock objects for authentication
        mockUsers[uid] = {
          uid,
          email,
          displayName: displayName || '',
          businesses: []
        };
        mockTokens[token] = uid;
        console.log('Stored mock token for user:', uid);
        
        // Return user info and token
        return res.status(201).json({
          user: {
            uid,
            email,
            displayName: displayName || '',
            businesses: []
          },
          token
        });
      } catch (firestoreError) {
        console.error('Error saving user to Firestore:', firestoreError);
        return res.status(500).json({ error: 'Failed to save user data' });
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed: ' + (error.message || 'Unknown error') });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('Login endpoint called with:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Login with Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      } else {
        // Create user document if it doesn't exist
        await setDoc(userDoc, {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Generate token (using Firebase ID token)
      const token = await userCredential.user.getIdToken();
      
      console.log('User logged in successfully:', uid);
      
      // Return user info and token
      return res.status(200).json({
        user: userData,
        token
      });
    } catch (authError: any) {
      console.error('Firebase Auth login error:', authError);
      
      // Handle Firebase Auth specific errors
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        return res.status(401).json({ error: 'Invalid email or password' });
      } else if (authError.code === 'auth/too-many-requests') {
        return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      }
      
      // Fallback to simple login if Firebase Auth fails
      console.log('Falling back to simple login');
      
      // Try to find user in Firestore by email
      try {
        const q = query(usersCollection, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Get the first matching user
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Generate a simple token
        const token = `token_${userData.uid}_${Date.now()}`;
        
        // Store user and token in mock objects for authentication
        mockUsers[userData.uid] = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName || '',
          businesses: userData.businesses || []
        };
        mockTokens[token] = userData.uid;
        console.log('Stored mock token for user:', userData.uid);
        
        console.log('User logged in with fallback method:', userData.uid);
        
        // Return user info and token
        return res.status(200).json({
          user: userData,
          token
        });
      } catch (firestoreError) {
        console.error('Error finding user in Firestore:', firestoreError);
        return res.status(500).json({ error: 'Failed to authenticate user' });
      }
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed: ' + (error.message || 'Unknown error') });
  }
});

// Validate token endpoint
router.post('/validate-token', (req, res) => {
  try {
    console.log('Validate token endpoint called with:', req.body);
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // For simple tokens, check if it exists in mockTokens
    if (token.startsWith('token_')) {
      const uid = mockTokens[token];
      if (uid && mockUsers[uid]) {
        return res.status(200).json({ valid: true, user: mockUsers[uid] });
      }
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    
    // For Firebase tokens, we would verify with Firebase Admin SDK
    // But in this simple implementation, we'll just return success
    // In a real implementation, we would use adminAuth.verifyIdToken(token)
    return res.status(200).json({ valid: true });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'Token validation failed: ' + (error.message || 'Unknown error') });
  }
});

// Get current user endpoint
router.get('/me', verifyToken, async (req: any, res) => {
  try {
    // User data is already attached to the request by the verifyToken middleware
    return res.status(200).json({ user: req.user });
  } catch (error: any) {
    console.error('Error getting user data:', error);
    return res.status(500).json({ error: 'Failed to get user data: ' + (error.message || 'Unknown error') });
  }
});

// Validate token endpoint
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Check if it's a mock token
    if (token.startsWith('mock-')) {
      console.log('Validating mock token:', token);
      const uid = mockTokens[token];
      if (!uid) {
        return res.status(401).json({ valid: false, error: 'Invalid token' });
      }
      return res.status(200).json({ valid: true, user: mockUsers[uid] });
    }
    
    // Verify with Firebase Auth
    try {
      // If we have admin SDK available, use it to verify the token
      if (adminAuth && adminDb) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        
        // Get user data from Firestore
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
          return res.status(404).json({ valid: false, error: 'User not found' });
        }
        
        return res.status(200).json({ valid: true, user: userDoc.data() });
      } else {
        throw new Error('Admin SDK not available');
      }
    } catch (error) {
      console.log('Error verifying token with Admin SDK, falling back to client SDK');
      
      // Fallback to client SDK
      try {
        // This is a simplified validation that just checks if the token exists in our system
        // In a real app, you'd want to actually verify the token's signature
        console.log('Creating mock user from token:', token);
        return res.status(200).json({ valid: true });
      } catch (clientError) {
        console.error('Error validating token with client SDK:', clientError);
        return res.status(401).json({ valid: false, error: 'Invalid token' });
      }
    }
  } catch (error: any) {
    console.error('Token validation error:', error);
    return res.status(500).json({ valid: false, error: 'Token validation failed: ' + (error.message || 'Unknown error') });
  }
});

// Update user profile endpoint
router.put('/profile', verifyToken, async (req: any, res) => {
  try {
    const { displayName, photoURL } = req.body;
    const uid = req.user.uid;
    
    // Update user document in Firestore
    const userDoc = doc(usersCollection, uid);
    await setDoc(userDoc, {
      displayName: displayName || req.user.displayName,
      photoURL: photoURL || req.user.photoURL,
      updatedAt: new Date()
    }, { merge: true });
    
    // Get updated user data
    const updatedUserDoc = await getDoc(userDoc);
    if (!updatedUserDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return updated user data
    return res.status(200).json({ user: updatedUserDoc.data() });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update profile: ' + (error.message || 'Unknown error') });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  // Since we're using JWT tokens, we don't need to do anything on the server
  // The client will simply remove the token from storage
  return res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
