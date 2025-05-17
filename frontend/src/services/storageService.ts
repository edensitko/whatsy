/**
 * Storage service for handling file uploads
 * 
 * This service provides functions for uploading files to Firebase Storage
 * and converting files to base64 strings for local storage.
 */
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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

// Get Firebase Storage instance
const storage = getStorage();

// In-memory storage as fallback for demonstration purposes
const localImageStorage: Record<string, string> = {};

/**
 * Convert a file to base64 string
 * @param file - The file to convert
 * @returns A promise that resolves to the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Upload a file to Firebase Storage with progress tracking
 * Falls back to local base64 storage if Firebase upload fails
 * 
 * @param file - The file to upload
 * @param path - The path in Firebase Storage
 * @param onProgress - Optional callback for upload progress
 * @returns A promise that resolves to the download URL
 */
export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Try to upload to Firebase Storage first
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          if (onProgress) onProgress(progress);
        }, 
        (error) => {
          // Handle unsuccessful uploads
          console.error('Error uploading to Firebase:', error);
          
          // Fall back to local base64 storage
          console.log('Falling back to local base64 storage');
          fileToBase64(file).then(base64String => {
            localImageStorage[path] = base64String;
            resolve(base64String);
          }).catch(reject);
        }, 
        async () => {
          // Handle successful uploads
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error starting upload:', error);
    
    // Fall back to local base64 storage
    console.log('Falling back to local base64 storage');
    const base64String = await fileToBase64(file);
    localImageStorage[path] = base64String;
    return base64String;
  }
};

/**
 * Upload multiple files to Firebase Storage
 * Falls back to local base64 storage if Firebase upload fails
 * 
 * @param files - The files to upload
 * @param basePath - The base path in Firebase Storage
 * @param onProgress - Optional callback for overall upload progress
 * @returns A promise that resolves to an array of download URLs
 */
export const uploadMultipleFiles = async (
  files: File[], 
  basePath: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  try {
    // Track overall progress
    let totalProgress = 0;
    const fileCount = files.length;
    
    const uploadPromises = files.map(async (file, index) => {
      // Create a unique path for each file
      const path = `${basePath}/${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Upload the file with progress tracking
      return uploadFile(file, path, (progress) => {
        // Update the progress for this file
        const fileProgress = progress / 100; // Convert percentage to fraction
        const fileWeight = 1 / fileCount; // Each file contributes equally to overall progress
        
        // Update overall progress
        totalProgress += fileWeight * fileProgress;
        
        // Report overall progress if callback provided
        if (onProgress) {
          onProgress(Math.min(totalProgress * 100, 99)); // Cap at 99% until all files are done
        }
      });
    });
    
    const results = await Promise.all(uploadPromises);
    
    // Report 100% progress when all files are done
    if (onProgress) onProgress(100);
    
    return results;
  } catch (error) {
    console.error('Error processing multiple files:', error);
    throw error;
  }
};

/**
 * Get all files with a specific path prefix from local storage
 * @param pathPrefix - The path prefix to filter by
 * @returns An array of base64 data URLs
 */
export const listFiles = (pathPrefix: string): string[] => {
  try {
    // Filter the local storage object for keys that start with the path prefix
    const matchingUrls = Object.entries(localImageStorage)
      .filter(([key]) => key.startsWith(pathPrefix))
      .map(([_, value]) => value);
    
    return matchingUrls;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * Clear all stored images (for cleanup/testing)
 */
export const clearStorage = (): void => {
  Object.keys(localImageStorage).forEach(key => {
    delete localImageStorage[key];
  });
  console.log('Local image storage cleared');
};
