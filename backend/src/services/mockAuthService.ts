/**
 * Mock Authentication Service
 * This is a simplified authentication service that doesn't rely on Firebase
 * It's used for development purposes when Firebase Admin SDK is not properly configured
 */

import { v4 as uuidv4 } from 'uuid';
import { User } from './authService';

// In-memory storage for users and tokens
const users: Record<string, User> = {};
const tokens: Record<string, string> = {};
const emailToUid: Record<string, string> = {};

/**
 * Register a new user
 */
export function mockRegisterUser(email: string, password: string, displayName?: string): { user: User, token: string } {
  // Check if email already exists
  if (emailToUid[email]) {
    throw new Error('Email already in use');
  }

  // Create a new user
  const uid = uuidv4();
  const user: User = {
    uid,
    email,
    displayName: displayName || '',
    businesses: []
  };

  // Store user
  users[uid] = user;
  emailToUid[email] = uid;

  // Generate token
  const token = generateToken(uid);

  return { user, token };
}

/**
 * Login a user
 */
export function mockLoginUser(email: string, password: string): { user: User, token: string } {
  // Check if email exists
  const uid = emailToUid[email];
  if (!uid) {
    throw new Error('Invalid email or password');
  }

  // Get user
  const user = users[uid];
  if (!user) {
    throw new Error('User not found');
  }

  // Generate token
  const token = generateToken(uid);

  return { user, token };
}

/**
 * Verify a token
 */
export function mockVerifyToken(token: string): User | null {
  const uid = tokens[token];
  if (!uid) {
    return null;
  }

  return users[uid] || null;
}

/**
 * Generate a token for a user
 */
function generateToken(uid: string): string {
  const token = `mock_token_${uid}_${Date.now()}`;
  tokens[token] = uid;
  return token;
}

/**
 * Get user by ID
 */
export function getUserById(uid: string): User | null {
  return users[uid] || null;
}

/**
 * Update user
 */
export function updateUser(uid: string, data: Partial<User>): User | null {
  const user = users[uid];
  if (!user) {
    return null;
  }

  // Update user data
  users[uid] = {
    ...user,
    ...data,
    uid // Ensure UID doesn't change
  };

  return users[uid];
}

/**
 * Add business to user
 */
export function addBusinessToUser(uid: string, businessId: string): boolean {
  const user = users[uid];
  if (!user) {
    return false;
  }

  // Add business if not already added
  if (!user.businesses?.includes(businessId)) {
    user.businesses = [...(user.businesses || []), businessId];
  }

  return true;
}

/**
 * Remove business from user
 */
export function removeBusinessFromUser(uid: string, businessId: string): boolean {
  const user = users[uid];
  if (!user || !user.businesses) {
    return false;
  }

  // Remove business
  user.businesses = user.businesses.filter(id => id !== businessId);
  return true;
}

// Initialize with some test users
mockRegisterUser('test@example.com', 'password123', 'Test User');
mockRegisterUser('admin@example.com', 'admin123', 'Admin User');

console.log('Mock authentication service initialized with test users');
