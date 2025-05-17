import { apiRequest } from './apiService';

export interface Appointment {
  id?: string;
  title: string;
  date: string; // ISO string
  time: string;
  duration: number;
  clientName: string;
  clientPhone: string;
  notes?: string;
  businessId: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all appointments for the current user
 * @returns Promise resolving to an array of appointments
 */
export const getAllAppointments = async (): Promise<Appointment[]> => {
  return await apiRequest<Appointment[]>('/appointments');
};

/**
 * Get appointments for a specific date
 * @param date Date to get appointments for (ISO string or Date object)
 * @returns Promise resolving to an array of appointments
 */
export const getAppointmentsByDate = async (date: string | Date): Promise<Appointment[]> => {
  try {
    // Format date as YYYY-MM-DD for the API endpoint
    const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
    console.log(`Fetching appointments for date: ${dateString}`);
    return await apiRequest<Appointment[]>(`/appointments/date/${dateString}`);
  } catch (error) {
    console.error('Error in getAppointmentsByDate:', error);
    return [];
  }
};

/**
 * Get appointments for a specific business
 * @param businessId Business ID to get appointments for
 * @returns Promise resolving to an array of appointments
 */
export const getBusinessAppointments = async (businessId: string): Promise<Appointment[]> => {
  return await apiRequest<Appointment[]>(`/appointments/business/${businessId}`);
};

/**
 * Get a single appointment by ID
 * @param id Appointment ID
 * @returns Promise resolving to the appointment
 */
export const getAppointmentById = async (id: string): Promise<Appointment> => {
  return await apiRequest<Appointment>(`/appointments/${id}`);
};

/**
 * Create a new appointment
 * @param appointmentData Appointment data
 * @returns Promise resolving to the created appointment
 */
export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Appointment> => {
  return await apiRequest<Appointment>('/appointments', 'POST', appointmentData);
};

/**
 * Update an appointment
 * @param id Appointment ID
 * @param appointmentData Updated appointment data
 * @returns Promise resolving to the updated appointment
 */
export const updateAppointment = async (id: string, appointmentData: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Appointment> => {
  return await apiRequest<Appointment>(`/appointments/${id}`, 'PUT', appointmentData);
};

/**
 * Delete an appointment
 * @param id Appointment ID
 * @returns Promise resolving to a success message
 */
export const deleteAppointment = async (id: string): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(`/appointments/${id}`, 'DELETE');
};
