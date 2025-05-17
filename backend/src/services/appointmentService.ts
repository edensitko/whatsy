import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Appointment, AppointmentResponse } from '../models/appointment';

// Collection reference
const appointmentsCollection = collection(db, 'appointments');

/**
 * Convert Firestore appointment to API response format
 */
const appointmentToResponse = (appointment: Appointment, id: string): AppointmentResponse => {
  return {
    id,
    title: appointment.title,
    date: appointment.date instanceof Timestamp 
      ? appointment.date.toDate().toISOString() 
      : appointment.date instanceof Date 
        ? appointment.date.toISOString() 
        : new Date().toISOString(),
    time: appointment.time,
    duration: appointment.duration,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    notes: appointment.notes,
    businessId: appointment.businessId,
    userId: appointment.userId,
    createdAt: appointment.createdAt instanceof Timestamp 
      ? appointment.createdAt.toDate().toISOString() 
      : appointment.createdAt instanceof Date 
        ? appointment.createdAt.toISOString() 
        : new Date().toISOString(),
    updatedAt: appointment.updatedAt instanceof Timestamp 
      ? appointment.updatedAt.toDate().toISOString() 
      : appointment.updatedAt instanceof Date 
        ? appointment.updatedAt.toISOString() 
        : new Date().toISOString()
  };
};

/**
 * Create a new appointment
 */
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppointmentResponse> => {
  try {
    // Add timestamps
    const appointmentWithTimestamps = {
      ...appointmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(appointmentsCollection, appointmentWithTimestamps);
    
    // Get the newly created document
    const appointmentSnapshot = await getDoc(docRef);
    
    if (!appointmentSnapshot.exists()) {
      throw new Error('Failed to create appointment');
    }
    
    const appointment = appointmentSnapshot.data() as Appointment;
    return appointmentToResponse(appointment, docRef.id);
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Get all appointments for a user
 */
export const getUserAppointments = async (userId: string): Promise<AppointmentResponse[]> => {
  try {
    const q = query(
      appointmentsCollection, 
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const appointment = doc.data() as Appointment;
      return appointmentToResponse(appointment, doc.id);
    });
  } catch (error) {
    console.error('Error getting user appointments:', error);
    throw error;
  }
};

/**
 * Get appointments for a specific business
 */
export const getBusinessAppointments = async (businessId: string): Promise<AppointmentResponse[]> => {
  try {
    const q = query(
      appointmentsCollection, 
      where('businessId', '==', businessId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const appointment = doc.data() as Appointment;
      return appointmentToResponse(appointment, doc.id);
    });
  } catch (error) {
    console.error('Error getting business appointments:', error);
    throw error;
  }
};

/**
 * Get appointments for a specific date
 */
export const getAppointmentsByDate = async (userId: string, date: Date): Promise<AppointmentResponse[]> => {
  try {
    console.log(`Getting appointments for user ${userId} on date ${date.toISOString()}`);
    
    // Create start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert to Firestore Timestamps
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    // In development mode, use a simpler query to avoid requiring composite indexes
    let querySnapshot;
    try {
      // First try to get all appointments for the user
      const q = query(
        appointmentsCollection, 
        where('userId', '==', userId)
      );
      
      querySnapshot = await getDocs(q);
      
      // Then filter the results in memory by date
      const filteredDocs = querySnapshot.docs.filter((doc: any) => {
        const appointmentData = doc.data() as Appointment;
        const appointmentDate = appointmentData.date as unknown as Timestamp;
        
        // Check if the appointment date is within the range
        return appointmentDate.toDate() >= startOfDay && appointmentDate.toDate() <= endOfDay;
      });
      
      // Sort the filtered results by date and time
      filteredDocs.sort((a, b) => {
        const aData = a.data() as Appointment;
        const bData = b.data() as Appointment;
        
        // First compare by date
        const aDate = (aData.date as unknown as Timestamp).toDate();
        const bDate = (bData.date as unknown as Timestamp).toDate();
        
        if (aDate.getTime() !== bDate.getTime()) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // If dates are equal, compare by time
        return aData.time.localeCompare(bData.time);
      });
      
      // Create a new QuerySnapshot-like object with the filtered and sorted docs
      querySnapshot = {
        docs: filteredDocs,
        size: filteredDocs.length,
        empty: filteredDocs.length === 0
      } as any;
    } catch (error) {
      console.error('Error querying appointments:', error);
      throw error;
    }
    
    return querySnapshot.docs.map((doc: { data: () => Appointment; id: string; }) => {
      const appointment = doc.data() as Appointment;
      return appointmentToResponse(appointment, doc.id);
    });
  } catch (error) {
    console.error('Error getting appointments by date:', error);
    throw error;
  }
};

/**
 * Get a single appointment by ID
 */
export const getAppointmentById = async (appointmentId: string): Promise<AppointmentResponse> => {
  try {
    const appointmentDoc = doc(appointmentsCollection, appointmentId);
    const appointmentSnapshot = await getDoc(appointmentDoc);
    
    if (!appointmentSnapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointment = appointmentSnapshot.data() as Appointment;
    return appointmentToResponse(appointment, appointmentId);
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw error;
  }
};

/**
 * Update an appointment
 */
export const updateAppointment = async (
  appointmentId: string, 
  appointmentData: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AppointmentResponse> => {
  try {
    const appointmentDoc = doc(appointmentsCollection, appointmentId);
    
    // Add updated timestamp
    const updates = {
      ...appointmentData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(appointmentDoc, updates);
    
    // Get the updated document
    const updatedSnapshot = await getDoc(appointmentDoc);
    
    if (!updatedSnapshot.exists()) {
      throw new Error('Appointment not found after update');
    }
    
    const appointment = updatedSnapshot.data() as Appointment;
    return appointmentToResponse(appointment, appointmentId);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * Delete an appointment
 */
export const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
  try {
    const appointmentDoc = doc(appointmentsCollection, appointmentId);
    await deleteDoc(appointmentDoc);
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};
