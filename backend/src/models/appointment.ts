import { Timestamp } from 'firebase/firestore';

export interface Appointment {
  id?: string;
  title: string;
  date: Timestamp | Date;
  time: string;
  duration: number;
  clientName: string;
  clientPhone: string;
  notes?: string;
  businessId: string;
  userId: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface AppointmentResponse {
  id: string;
  title: string;
  date: string; // ISO string
  time: string;
  duration: number;
  clientName: string;
  clientPhone: string;
  notes?: string;
  businessId: string;
  userId: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
