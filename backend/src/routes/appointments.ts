import express from 'express';
import { Request, Response } from 'express-serve-static-core';
import { 
  createAppointment, 
  getUserAppointments, 
  getBusinessAppointments, 
  getAppointmentsByDate, 
  getAppointmentById, 
  updateAppointment, 
  deleteAppointment 
} from '../services/appointmentService';
import { Timestamp } from 'firebase/firestore';
import { authenticateToken } from '../middleware';

const router = express.Router();

// Apply authentication middleware to all appointment routes
router.use(authenticateToken);

// Create a new appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, date, time, duration, clientName, clientPhone, notes, businessId } = req.body;
    
    if (!title || !date || !time || !duration || !clientName || !clientPhone || !businessId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Convert date string to Timestamp
    const dateObj = new Date(date);
    const timestampDate = Timestamp.fromDate(dateObj);
    
    const appointmentData = {
      title,
      date: timestampDate,
      time,
      duration: Number(duration),
      clientName,
      clientPhone,
      notes: notes || '',
      businessId,
      userId: (req as any).user.uid
    };
    
    const newAppointment = await createAppointment(appointmentData);
    res.status(201).json(newAppointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to create appointment' });
  }
});

// Get all appointments for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const appointments = await getUserAppointments((req as any).user.uid);
    res.status(200).json(appointments);
  } catch (error: any) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ error: error.message || 'Failed to get appointments' });
  }
});

// Get appointments for a specific business
router.get('/business/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const appointments = await getBusinessAppointments(businessId);
    res.status(200).json(appointments);
  } catch (error: any) {
    console.error('Error getting business appointments:', error);
    res.status(500).json({ error: error.message || 'Failed to get business appointments' });
  }
});

// Get appointments for a specific date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get appointments for the authenticated user and the given date
    const appointments = await getAppointmentsByDate((req as any).user.uid, dateObj);
    res.status(200).json(appointments);
  } catch (error: any) {
    console.error('Error getting appointments by date:', error);
    res.status(500).json({ error: error.message || 'Failed to get appointments by date' });
  }
});

// Get a single appointment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await getAppointmentById(id);
    
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify the appointment belongs to the authenticated user
    if (appointment.userId !== (req as any).user.uid) {
      return res.status(403).json({ error: 'Not authorized to access this appointment' });
    }
    
    res.status(200).json(appointment);
  } catch (error: any) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to get appointment' });
  }
});

// Update an appointment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, date, time, duration, clientName, clientPhone, notes, businessId } = req.body;
    
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // First get the appointment to verify ownership
    const existingAppointment = await getAppointmentById(id);
    
    // Verify the appointment belongs to the authenticated user
    if (existingAppointment.userId !== (req as any).user.uid) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }
    
    const updates: any = {};
    
    if (title) updates.title = title;
    if (date) {
      const dateObj = new Date(date);
      updates.date = Timestamp.fromDate(dateObj);
    }
    if (time) updates.time = time;
    if (duration) updates.duration = Number(duration);
    if (clientName) updates.clientName = clientName;
    if (clientPhone) updates.clientPhone = clientPhone;
    if (notes !== undefined) updates.notes = notes;
    if (businessId) updates.businessId = businessId;
    
    const updatedAppointment = await updateAppointment(id, updates);
    res.status(200).json(updatedAppointment);
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to update appointment' });
  }
});

// Delete an appointment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Ensure user is authenticated
    // Use type assertion to bypass TypeScript error
if (!(req as any).user || !(req as any).user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // First get the appointment to verify ownership
    const existingAppointment = await getAppointmentById(id);
    
    // Verify the appointment belongs to the authenticated user
    if (existingAppointment.userId !== (req as any).user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this appointment' });
    }
    
    await deleteAppointment(id);
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to delete appointment' });
  }
});

export const appointmentsRouter = router;
