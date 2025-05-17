import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion, addDoc, Timestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, adminDb, isDevelopment } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// Business interface
export interface Business {
  id: string;
  name: string;
  description: string;
  phone_number: string;
  whatsapp_number: string;
  bot_id: string;
  owner_id: string; // User ID of the business owner
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  prompt_template: string;
  openai_api_key?: string; // API key for OpenAI integration
  business_data?: Record<string, any>; // Additional business data as JSON
  created_at: Date;
  updated_at: Date;
}

// FAQ item interface
interface FaqItem {
  question: string;
  answer: string;
}

// Reference to the businesses collection in Firestore
const businessesCollection = collection(db, 'businesses');

// Helper function to convert Firestore timestamps to dates
function convertTimestamps(data: any): any {
  if (!data) return data;
  
  const result = { ...data };
  
  if (result.created_at && typeof result.created_at.toDate === 'function') {
    result.created_at = result.created_at.toDate();
  } else if (result.created_at) {
    result.created_at = new Date(result.created_at);
  }
  
  if (result.updated_at && typeof result.updated_at.toDate === 'function') {
    result.updated_at = result.updated_at.toDate();
  } else if (result.updated_at) {
    result.updated_at = new Date(result.updated_at);
  }
  
  return result;
}

// Helper function to convert frontend business format to backend format
function convertFrontendToBackendBusiness(frontendBusiness: any): Partial<Business> {
  // If it already matches our backend format, return as is
  if (frontendBusiness.phone_number && typeof frontendBusiness.hours === 'object') {
    return frontendBusiness;
  }

  // Convert from frontend format to backend format
  const backendBusiness: Partial<Business> = {
    name: frontendBusiness.name,
    description: frontendBusiness.description,
    phone_number: frontendBusiness.whatsapp_number || '',
    prompt_template: frontendBusiness.prompt_template || '',
    owner_id: frontendBusiness.owner_id || ''
  };

  // Convert hours from string to object
  if (typeof frontendBusiness.hours === 'string') {
    const hoursLines = frontendBusiness.hours.split('\n');
    const hoursObject: any = {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    };

    // Try to parse hours from string format
    for (const line of hoursLines) {
      if (line.toLowerCase().includes('monday')) {
        hoursObject.monday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('tuesday')) {
        hoursObject.tuesday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('wednesday')) {
        hoursObject.wednesday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('thursday')) {
        hoursObject.thursday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('friday')) {
        hoursObject.friday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('saturday')) {
        hoursObject.saturday = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('sunday')) {
        hoursObject.sunday = line.split(':').slice(1).join(':').trim();
      }
    }

    backendBusiness.hours = hoursObject;
  }

  // Convert FAQ from array of strings to array of question/answer objects
  if (Array.isArray(frontendBusiness.faq)) {
    backendBusiness.faq = frontendBusiness.faq.map((item: any) => {
      // If it's already in the right format, return as is
      if (typeof item === 'object' && item !== null && 'question' in item && 'answer' in item) {
        return item as FaqItem;
      }
      
      // Otherwise, convert from string to question/answer object
      return {
        question: item as string,
        answer: 'Please provide more information about this.'
      };
    });
  }

  return backendBusiness;
}

// Helper function to convert backend business format to frontend format
function convertToFrontendFormat(backendBusiness: Business): any {
  // Convert hours from object to string
  let hoursString = '';
  // Make sure hours exists and initialize it if it doesn't
  const hours = backendBusiness.hours || {
    monday: '', tuesday: '', wednesday: '', thursday: '',
    friday: '', saturday: '', sunday: ''
  };
  
  if (hours.monday) hoursString += `Monday: ${hours.monday}\n`;
  if (hours.tuesday) hoursString += `Tuesday: ${hours.tuesday}\n`;
  if (hours.wednesday) hoursString += `Wednesday: ${hours.wednesday}\n`;
  if (hours.thursday) hoursString += `Thursday: ${hours.thursday}\n`;
  if (hours.friday) hoursString += `Friday: ${hours.friday}\n`;
  if (hours.saturday) hoursString += `Saturday: ${hours.saturday}\n`;
  if (hours.sunday) hoursString += `Sunday: ${hours.sunday}\n`;
  
  // Convert FAQ from array of question/answer objects to array of strings
  const faq = backendBusiness.faq ? 
    backendBusiness.faq.map(item => item.question) : 
    [];
  
  // Return in frontend format
  return {
    id: backendBusiness.id,
    name: backendBusiness.name,
    description: backendBusiness.description,
    whatsapp_number: backendBusiness.whatsapp_number || backendBusiness.phone_number,
    phone_number: backendBusiness.phone_number,
    bot_id: backendBusiness.bot_id,
    owner_id: backendBusiness.owner_id,
    hours: hoursString.trim(),
    faq,
    prompt_template: backendBusiness.prompt_template,
    openai_api_key: backendBusiness.openai_api_key,
    created_at: backendBusiness.created_at,
    updated_at: backendBusiness.updated_at
  };
}

/**
 * Create a new business
 * @param businessData Business data without ID and timestamps
 * @returns The created business
 */
export async function createBusiness(businessData: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> {
  try {
    // Generate a new business ID
    const id = `biz-${uuidv4().substring(0, 8)}`;
    
    // Generate a new bot ID if not provided
    const bot_id = businessData.bot_id || `bot-${uuidv4().substring(0, 8)}`;
    
    // Convert from frontend format if needed
    const convertedData = convertFrontendToBackendBusiness(businessData);
    
    // Create the business object
    const business: Business = {
      id,
      name: convertedData.name || businessData.name,
      description: convertedData.description || businessData.description,
      phone_number: convertedData.phone_number || businessData.phone_number,
      whatsapp_number: businessData.whatsapp_number,
      bot_id,
      owner_id: convertedData.owner_id || businessData.owner_id || '',
      hours: convertedData.hours || businessData.hours,
      faq: convertedData.faq || businessData.faq,
      prompt_template: convertedData.prompt_template || businessData.prompt_template,
      openai_api_key: convertedData.openai_api_key || businessData.openai_api_key,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Save to Firestore
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      await setDoc(doc(businessesCollection, id), {
        ...business,
        created_at: Timestamp.fromDate(business.created_at),
        updated_at: Timestamp.fromDate(business.updated_at)
      });
    } else {
      // Use Admin SDK in production
      await adminDb.collection('businesses').doc(id).set({
        ...business,
        created_at: business.created_at,
        updated_at: business.updated_at
      });
    }
    
    // If the business has an owner, add it to the user's businesses
    if (business.owner_id) {
      try {
        if (isDevelopment || !adminDb) {
          // Use client SDK in development mode
          const userDoc = doc(collection(db, 'users'), business.owner_id);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            await updateDoc(userDoc, {
              businesses: arrayUnion(id)
            });
          }
        } else {
          // Use Admin SDK in production
          const userRef = adminDb.collection('users').doc(business.owner_id);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            await userRef.update({
              businesses: arrayUnion(id)
            });
          }
        }
      } catch (error) {
        console.error('Error adding business to user:', error);
        // Continue even if this fails
      }
    }
    
    return business;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
}

/**
 * Get all businesses
 * @returns Array of businesses
 */
export async function getAllBusinesses(): Promise<any[]> {
  try {
    let snapshot;
    
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      snapshot = await getDocs(businessesCollection);
    } else {
      // Use Admin SDK in production
      snapshot = await adminDb.collection('businesses').get();
    }
    
    if (snapshot.empty) {
      console.log('No businesses found');
      return [];
    }
    
    // Convert to array of businesses
    const businesses = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps(data);
    });
    
    // Convert to frontend format
    const frontendBusinesses = businesses.map(business => convertToFrontendFormat(business as Business));
    
    return frontendBusinesses;
  } catch (error) {
    console.error('Error getting businesses:', error);
    throw error;
  }
}

/**
 * Get businesses by owner ID
 * @param ownerId The ID of the business owner
 * @returns Array of businesses owned by the user
 */
export async function getBusinessesByOwnerId(ownerId: string): Promise<any[]> {
  try {
    let snapshot;
    
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      const q = query(businessesCollection, where("owner_id", "==", ownerId));
      snapshot = await getDocs(q);
    } else {
      // Use Admin SDK in production
      snapshot = await adminDb.collection('businesses').where("owner_id", "==", ownerId).get();
    }
    
    if (snapshot.empty) {
      console.log('No businesses found for owner:', ownerId);
      return [];
    }
    
    // Convert to array of businesses
    const businesses = snapshot.docs.map(doc => {
      const data = doc.data();
      return convertTimestamps(data);
    });
    
    // Convert to frontend format
    const frontendBusinesses = businesses.map(business => convertToFrontendFormat(business as Business));
    
    return frontendBusinesses;
  } catch (error) {
    console.error('Error getting businesses by owner ID:', error);
    throw error;
  }
}

/**
 * Get a business by ID
 * @param id Business ID
 * @returns The business or null if not found
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  try {
    let docSnapshot;
    
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      docSnapshot = await getDoc(doc(businessesCollection, id));
      
      if (!docSnapshot.exists) {
        console.log('No business found with ID:', id);
        return null;
      }
    } else {
      // Use Admin SDK in production
      docSnapshot = await adminDb.collection('businesses').doc(id).get();
      
      if (!docSnapshot.exists) {
        console.log('No business found with ID:', id);
        return null;
      }
    }
    
    const businessData = docSnapshot.data();
    const business = convertTimestamps(businessData) as Business;
    
    // Convert to frontend format
    return convertToFrontendFormat(business);
  } catch (error) {
    console.error('Error getting business by ID:', error);
    throw error;
  }
}

/**
 * Update an existing business
 * @param id Business ID
 * @param businessData Partial business data to update
 * @returns The updated business or null if not found
 */
export async function updateBusiness(id: string, businessData: Partial<Business>): Promise<Business | null> {
  try {
    console.log(`Starting update for business ID: ${id}`);
    console.log('Received business data:', JSON.stringify(businessData, null, 2));
    
    // Get the existing business
    const existingBusiness = await getBusinessById(id);
    if (!existingBusiness) {
      console.log('No business found with ID:', id);
      return null;
    }
    
    // Convert from frontend format if needed
    let convertedData;
    try {
      convertedData = convertFrontendToBackendBusiness(businessData);
      console.log('Converted data:', JSON.stringify(convertedData, null, 2));
    } catch (conversionError) {
      console.error('Error converting business data:', conversionError);
      // Continue with original data if conversion fails
      convertedData = businessData;
    }
    
    // Create a clean update object
    const cleanUpdate: Record<string, any> = {};
    
    // Add only valid fields to the update object
    if (convertedData.name !== undefined) cleanUpdate.name = convertedData.name;
    if (convertedData.description !== undefined) cleanUpdate.description = convertedData.description;
    if (convertedData.phone_number !== undefined) cleanUpdate.phone_number = convertedData.phone_number;
    if (convertedData.whatsapp_number !== undefined) cleanUpdate.whatsapp_number = convertedData.whatsapp_number;
    if (convertedData.prompt_template !== undefined) cleanUpdate.prompt_template = convertedData.prompt_template;
    if (convertedData.owner_id !== undefined) cleanUpdate.owner_id = convertedData.owner_id;
    
    // Handle hours carefully
    if (convertedData.hours !== undefined) {
      if (typeof convertedData.hours === 'string' || 
          (typeof convertedData.hours === 'object' && convertedData.hours !== null)) {
        cleanUpdate.hours = convertedData.hours;
      }
    }
    
    // Handle FAQ carefully
    if (convertedData.faq !== undefined && Array.isArray(convertedData.faq)) {
      cleanUpdate.faq = convertedData.faq;
    }
    
    // Handle business_data carefully
    if (convertedData.business_data !== undefined && 
        typeof convertedData.business_data === 'object' && 
        convertedData.business_data !== null) {
      cleanUpdate.business_data = convertedData.business_data;
    }
    
    // Always add updated_at
    cleanUpdate.updated_at = new Date();
    cleanUpdate.id = id; // Ensure ID doesn't change
    
    console.log('Clean update object:', JSON.stringify(cleanUpdate, null, 2));
    
    // Merge with existing data
    const updatedBusiness = {
      ...existingBusiness,
      ...cleanUpdate
    };
    
    // Update in Firestore
    try {
      // Sanitize data for Firestore
      const sanitizedBusiness = { ...updatedBusiness };
      
      // Ensure dates are properly formatted for Firestore
      if (sanitizedBusiness.updated_at) {
        try {
          if (sanitizedBusiness.updated_at instanceof Date) {
            // Keep it as is, will be converted below
          } else if (typeof sanitizedBusiness.updated_at === 'string') {
            sanitizedBusiness.updated_at = new Date(sanitizedBusiness.updated_at);
          }
        } catch (dateError) {
          console.error('Error converting updated_at date:', dateError);
          sanitizedBusiness.updated_at = new Date(); // Fallback to current date
        }
      }
      
      if (sanitizedBusiness.created_at) {
        try {
          if (sanitizedBusiness.created_at instanceof Date) {
            // Keep it as is, will be converted below
          } else if (typeof sanitizedBusiness.created_at === 'string') {
            sanitizedBusiness.created_at = new Date(sanitizedBusiness.created_at);
          }
        } catch (dateError) {
          console.error('Error converting created_at date:', dateError);
          // Don't modify created_at if conversion fails
        }
      }
      
      // Ensure hours is properly formatted
      if (sanitizedBusiness.hours && typeof sanitizedBusiness.hours === 'object') {
        // Make sure all days are strings
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const hoursObj = sanitizedBusiness.hours as Record<string, any>;
        
        days.forEach(day => {
          if (hoursObj[day] === undefined) {
            hoursObj[day] = '';
          } else if (typeof hoursObj[day] !== 'string') {
            hoursObj[day] = String(hoursObj[day]);
          }
        });
      }
      
      // Ensure faq is properly formatted
      if (sanitizedBusiness.faq) {
        if (Array.isArray(sanitizedBusiness.faq)) {
          // Filter out any invalid items
          sanitizedBusiness.faq = sanitizedBusiness.faq.filter(item => {
            return item !== null && (
              typeof item === 'string' || 
              (typeof item === 'object' && 'question' in item && item.question)
            );
          });
          
          // Ensure all FAQ items have both question and answer properties
          sanitizedBusiness.faq = sanitizedBusiness.faq.map(item => {
            if (typeof item === 'string') {
              return { question: item, answer: 'No answer provided yet.' };
            } else if (typeof item === 'object') {
              return {
                question: item.question || '',
                answer: item.answer || 'No answer provided yet.'
              };
            }
            return item; // Should never reach here due to filter above
          });
        } else {
          // If faq is not an array, set it to an empty array
          sanitizedBusiness.faq = [];
        }
      }
      
      if (isDevelopment || !adminDb) {
        // Use client SDK in development mode
        // Create a clean update object that doesn't contain undefined values
        const updateData = Object.entries(sanitizedBusiness).reduce((acc, [key, value]) => {
          // Skip undefined values to prevent Firebase errors
          if (value !== undefined) {
            // Convert Date objects to Firestore Timestamps
            if (value instanceof Date) {
              acc[key] = Timestamp.fromDate(value);
            } else {
              acc[key] = value;
            }
          }
          return acc;
        }, {} as Record<string, any>);
        
        console.log('Final update data for Firestore client SDK:', JSON.stringify(updateData, (key, value) => {
          if (value instanceof Timestamp) return `Timestamp(${value.seconds}, ${value.nanoseconds})`;
          return value;
        }, 2));
        
        await updateDoc(doc(businessesCollection, id), updateData);
      } else {
        // Use Admin SDK in production
        // Create a clean update object that doesn't contain undefined values
        const updateData = Object.entries(sanitizedBusiness).reduce((acc, [key, value]) => {
          // Skip undefined values to prevent Firebase errors
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        console.log('Final update data for Firestore Admin SDK:', JSON.stringify(updateData, null, 2));
        
        await adminDb.collection('businesses').doc(id).update(updateData);
      }
    } catch (updateError) {
      console.error('Error during Firestore update operation:', updateError);
      throw new Error('Error updating business');
    }
    
    return updatedBusiness;
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
}

/**
 * Delete business
 * @param id Business ID
 * @returns True if deleted successfully
 */
export async function deleteBusiness(id: string): Promise<boolean> {
  try {
    // Get the business to check if it exists and get owner_id
    const business = await getBusinessById(id);
    if (!business) {
      console.log('No business found with ID:', id);
      return false;
    }
    
    // Delete from Firestore
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      await deleteDoc(doc(businessesCollection, id));
    } else {
      // Use Admin SDK in production
      await adminDb.collection('businesses').doc(id).delete();
    }
    
    // If the business has an owner, remove it from the user's businesses
    if (business.owner_id) {
      try {
        if (isDevelopment || !adminDb) {
          // Use client SDK in development mode
          const userDoc = doc(collection(db, 'users'), business.owner_id);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            await updateDoc(userDoc, {
              businesses: arrayUnion(id)
            });
          }
        } else {
          // Use Admin SDK in production
          const userRef = adminDb.collection('users').doc(business.owner_id);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            await userRef.update({
              businesses: arrayUnion(id)
            });
          }
        }
      } catch (error) {
        console.error('Error removing business from user:', error);
        // Continue even if this fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting business:', error);
    throw error;
  }
}

/**
 * Get business by phone number
 * @param phoneNumber Phone number to search for
 * @returns The business or null if not found
 */
export async function getBusinessByPhoneNumber(phoneNumber: string): Promise<Business | null> {
  try {
    let snapshot;
    
    // Normalize phone number by removing any non-digit characters
    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    if (isDevelopment || !adminDb) {
      // Use client SDK in development mode
      const q = query(businessesCollection, where("phone_number", "==", normalizedPhoneNumber));
      snapshot = await getDocs(q);
    } else {
      // Use Admin SDK in production
      snapshot = await adminDb.collection('businesses').where("phone_number", "==", normalizedPhoneNumber).get();
    }
    
    if (snapshot.empty) {
      console.log('No business found with phone number:', phoneNumber);
      return null;
    }
    
    // Get the first matching business
    const businessData = snapshot.docs[0].data();
    const business = convertTimestamps(businessData) as Business;
    
    // Convert to frontend format
    return convertToFrontendFormat(business);
  } catch (error) {
    console.error('Error getting business by phone number:', error);
    throw error;
  }
}
