import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Firebase configuration for client SDK
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDsftA3WWt0RFn0MDB6g6FYrvTt3ZAAS-Y",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "botapp-898bd.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "botapp-898bd",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "botapp-898bd.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "923990411283",
  appId: process.env.FIREBASE_APP_ID || "1:923990411283:web:9fcfba22775ef20d3ad7e6",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-3QV6Q8RRRN"
};

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const clientStorage = getStorage(app);

// Enable offline persistence for better reliability
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore persistence enabled for offline support");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
        console.log("The current browser doesn't support all of the features required to enable persistence");
      } else {
        console.error("Error enabling persistence:", err);
      }
    });
} catch (error) {
  console.error("Error setting up persistence:", error);
}

// Initialize Firebase Admin SDK if not already initialized
let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

// Flag to determine if we're in development mode
// For Docker, we'll always use development mode to avoid service account issues
const isDevelopment = true; // process.env.NODE_ENV !== 'production';

try {
  if (!admin.apps.length) {
    // Get service account from environment variables or file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                             path.join(__dirname, '../../firebase-service-account.json');
    
    let adminInitialized = false;
    
    // Check if we have the service account as JSON in environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      try {
        // Initialize with service account from environment variable
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || "botapp-898bd"
        });
        adminDb = admin.firestore();
        adminInitialized = true;
      } catch (error) {
        console.error('Error initializing Firebase with service account JSON:', error);
      }
    } else if (fs.existsSync(serviceAccountPath) && !isDevelopment) {
      try {
        // Initialize with service account file
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          projectId: process.env.FIREBASE_PROJECT_ID || "botapp-898bd"
        });
        adminDb = admin.firestore();
        adminInitialized = true;
        adminAuth = admin.auth();
        adminInitialized = true;
        console.log('Firebase Admin SDK initialized with service account successfully');
      } catch (err) {
        console.error('Error initializing with service account:', err);
      }
    }
    
    if (!adminInitialized && !isDevelopment) {
      try {
        // Try application default credentials
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID || "botapp-898bd"
        });
        adminDb = admin.firestore();
        adminAuth = admin.auth();
        adminInitialized = true;
        console.log('Firebase Admin SDK initialized with application default credentials');
      } catch (err) {
        console.error('Error initializing with application default credentials:', err);
        
        // Last resort: Initialize with a mock app for development
        console.log('Initializing Firebase Admin with mock app for development');
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "botapp-898bd"
        });
        
        // We won't have adminAuth in this case, but we'll have adminDb
        try {
          adminDb = admin.firestore();
          console.log('Firebase Admin Firestore initialized in mock mode');
        } catch (firestoreErr) {
          console.error('Error initializing Firestore in mock mode:', firestoreErr);
        }
      }
    }
    
    // If we're in development mode or admin initialization failed, use client SDK
    if (isDevelopment || !adminInitialized) {
      console.log('Using client SDK for server operations in development mode');
      
      // Create the businesses collection if it doesn't exist (Client SDK)
      try {
        const businessesCollection = collection(db, 'businesses');
        const dummyDoc = doc(businessesCollection, 'dummy');
        setDoc(dummyDoc, { dummy: true })
          .then(() => deleteDoc(dummyDoc))
          .then(() => console.log('Businesses collection created/verified with Client SDK'))
          .catch(err => console.error('Error creating businesses collection with Client SDK:', err));
      } catch (err) {
        console.error('Error creating businesses collection with Client SDK:', err);
      }
    } else if (adminDb) {
      // Create the businesses collection if it doesn't exist (Admin SDK)
      try {
        adminDb.collection('businesses').doc('dummy').set({ dummy: true })
          .then(() => adminDb?.collection('businesses').doc('dummy').delete())
          .then(() => console.log('Businesses collection created/verified with Admin SDK'))
          .catch(err => console.error('Error creating businesses collection with Admin SDK:', err));
      } catch (err) {
        console.error('Error creating businesses collection with Admin SDK:', err);
      }
    }
  } else {
    adminDb = admin.firestore();
    adminAuth = admin.auth();
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Falling back to client SDK only');
}

// Initialize admin storage if admin SDK is initialized
let adminStorage: admin.storage.Storage | undefined;
if (admin.apps.length) {
  adminStorage = admin.storage();
}

// Type assertion for admin Firestore to ensure it's properly typed
const typedAdminDb = adminDb as admin.firestore.Firestore;

// Export Firebase instances
export { app, db, auth, clientStorage, typedAdminDb as adminDb, adminAuth, adminStorage, isDevelopment };

