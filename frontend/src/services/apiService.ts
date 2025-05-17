/**
 * API service for making authenticated requests to the backend
 */
// We'll create a simple getAuthHeaders function here to avoid circular dependencies
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
// Local server URL for direct access if needed
const LOCAL_SERVER_URL = 'http://localhost:3000/api';
// Firebase Cloud Functions URL (fallback)
const FIREBASE_API_URL = 'https://us-central1-smart-biz-chatflow.cloudfunctions.net/api';

/**
 * Check if the server is available
 * @returns Promise resolving to true if server is available, false otherwise
 */
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    // Try to connect to the server through proxy
    const response = await fetch(`/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });
    
    // Check if the response is OK
    if (response.ok) {
      console.log('Server connection successful via proxy');
      return true;
    }
    
    // If proxy fails, try direct connection to local server
    try {
      console.log('Trying direct connection to local server');
      const directResponse = await fetch(`${LOCAL_SERVER_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (directResponse.ok) {
        console.log('Direct connection to local server successful');
        return true;
      }
    } catch (directError) {
      console.error('Direct connection to local server failed:', directError);
    }
    
    // If all else fails, try Firebase Functions
    try {
      console.log('Trying connection to Firebase Functions');
      const firebaseResponse = await fetch(`${FIREBASE_API_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (firebaseResponse.ok) {
        console.log('Connection to Firebase Functions successful');
        return true;
      }
    } catch (firebaseError) {
      console.error('Connection to Firebase Functions failed:', firebaseError);
    }
    
    console.log('All connection attempts failed');
    return false;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};

/**
 * Generic API request function with multiple fallback options
 * @param endpoint API endpoint
 * @param method HTTP method
 * @param data Request body data
 * @returns Promise resolving to the response data
 */
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> => {
  try {
    // Set up request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...getAuthHeaders(),
      },
      // Change from 'include' to 'same-origin' to solve CORS issue
      credentials: 'same-origin',
    };
    
    // Add body for non-GET requests
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    // Only use local server endpoints to avoid CORS issues with Firebase Functions
    const endpointsToTry = [
      { url: `/api${endpoint}`, name: 'Proxy', options },
      { url: `${LOCAL_SERVER_URL}${endpoint}`, name: 'Local Server', options: {...options, mode: 'cors' as RequestMode, credentials: 'include' as RequestCredentials} }
      // Firebase Functions endpoint removed to avoid CORS issues
    ];
    
    let lastError: Error | null = null;
    
    // Try each endpoint in order
    for (const { url, name, options: requestOptions } of endpointsToTry) {
      try {
        console.log(`Attempting ${name} request to: ${url}`);
        const response = await fetch(url, requestOptions);
        
        if (response.ok) {
          console.log(`${name} request succeeded`);
          const responseData = await response.json();
          return responseData;
        }
        
        console.warn(`${name} request failed: ${response.status} ${response.statusText}`);
        
        // If we got a 500 error, log more details if possible
        if (response.status === 500) {
          try {
            const errorText = await response.text();
            console.error(`Server error details: ${errorText}`);
          } catch (e) {
            console.error('Could not read error details');
          }
        }
        
        // Store the error to throw if all endpoints fail
        lastError = new Error(`${name} request failed: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.warn(`${name} request error:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    // If we get here, all endpoints failed
    console.error('All API endpoints failed');
    throw lastError || new Error('API request failed with unknown error');
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Business API functions
 */
export const businessApi = {
  /**
   * Get all businesses
   * @returns Promise resolving to an array of businesses
   */
  getAll: async () => {
    try {
      // Make API request through the proxy
      const data = await apiRequest('/business');
      console.log('Successfully fetched businesses from Firebase via proxy:', data);
      return data;
    } catch (error) {
      console.error('Failed to get businesses from Firebase:', error);
      // Return empty array on error
      return [];
    }
  },
  
  /**
   * Get businesses owned by the current user
   * @returns Promise resolving to an array of businesses
   */
  getMyBusinesses: async () => {
    try {
      return await apiRequest('/business/my');
    } catch (error) {
      console.warn('Failed to get my businesses from API:', error);
      return [];
    }
  },
  
  /**
   * Get a business by ID
   * @param id Business ID
   * @returns Promise resolving to the business
   */
  getById: async (id: string) => {
    try {
      return await apiRequest(`/business/${id}`);
    } catch (error) {
      console.warn(`Failed to get business ${id} from API:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new business
   * @param businessData Business data
   * @returns Promise resolving to the created business
   */
  create: async (businessData: any) => {
    try {
      const newBusiness = await apiRequest('/business', 'POST', businessData);
      return newBusiness;
    } catch (error) {
      console.error('Failed to create business on API:', error);
      throw error;
    }
  },
  
  /**
   * Update a business
   * @param id Business ID
   * @param businessData Business data
   * @returns Promise resolving to the updated business
   */
  update: async (id: string, businessData: any) => {
    try {
      const updatedBusiness = await apiRequest(`/business/${id}`, 'PUT', businessData);
      return updatedBusiness;
    } catch (error) {
      console.error(`Failed to update business ${id} on API:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a business
   * @param id Business ID
   * @returns Promise resolving to the success message
   */
  delete: async (id: string) => {
    try {
      return await apiRequest(`/business/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Failed to delete business ${id} on API:`, error);
      throw error;
    }
  }
};

/**
 * WhatsApp API functions
 */
export const whatsappApi = {
  /**
   * Send a message to a WhatsApp number
   * @param to Phone number to send to
   * @param message Message to send
   * @returns Promise resolving to the message details
   */
  sendMessage: async (to: string, message: string) => {
    try {
      return await apiRequest('/whatsapp/send', 'POST', { to, message });
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }
};

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Register a new user
   * @param userData User data
   * @returns Promise resolving to the user data and token
   */
  register: async (userData: { email: string; password: string; displayName?: string }) => {
    return await apiRequest('/auth/register', 'POST', userData);
  },
  
  /**
   * Login a user
   * @param credentials Login credentials
   * @returns Promise resolving to the user data and token
   */
  login: async (credentials: { email: string; password: string }) => {
    return await apiRequest('/auth/login', 'POST', credentials);
  },
  
  /**
   * Validate a token
   * @param token Authentication token
   * @returns Promise resolving to the validation result
   */
  validateToken: async (token: string) => {
    return await apiRequest('/auth/validate', 'POST', { token });
  }
};
