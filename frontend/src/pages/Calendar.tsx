import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Appointment, getAllAppointments, getAppointmentsByDate, createAppointment, updateAppointment, deleteAppointment } from '@/services/appointmentService';

// Mock business data
interface Business {
  id: string;
  name: string;
}

const mockBusinesses: Business[] = [
  { id: 'all', name: 'כל העסקים' },
  { id: 'business-1', name: 'ייעוץ עסקי - רדאפ' },
  { id: 'business-2', name: 'מספרה - שיער ועוד' }
];

const Calendar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)); // Set to the first day of the week (Sunday)
  });
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    clientName: '',
    clientPhone: '',
    notes: '',
    businessId: 'business-1'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);

  // Fetch appointments when date, view mode, week start date, or selected business changes
  useEffect(() => {
    if (date || (viewMode === 'week' && weekStartDate)) {
      fetchAppointments();
    }
  }, [date, weekStartDate, viewMode, selectedBusiness]);

  // Fetch appointments from the API
  const fetchAppointments = async () => {
    if (viewMode === 'day' && !date) return;
    if (viewMode === 'week' && !weekStartDate) return;
    
    setLoading(true);
    try {
      let fetchedAppointments: Appointment[] = [];
      
      if (viewMode === 'day') {
        // Fetch appointments for a single day
        const dateString = date!.toISOString().split('T')[0];
        fetchedAppointments = await getAppointmentsByDate(dateString);
      } else {
        // Fetch appointments for the entire week
        const weekAppointments: Appointment[] = [];
        
        // Create an array of dates for the week
        const weekDates: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(weekStartDate);
          dayDate.setDate(weekStartDate.getDate() + i);
          weekDates.push(dayDate);
        }
        
        // Fetch appointments for each day in the week
        for (const dayDate of weekDates) {
          const dateString = dayDate.toISOString().split('T')[0];
          try {
            const dayAppointments = await getAppointmentsByDate(dateString);
            weekAppointments.push(...dayAppointments);
          } catch (error) {
            console.error(`Error fetching appointments for ${dateString}:`, error);
          }
        }
        
        fetchedAppointments = weekAppointments;
      }
      
      // Filter by business if needed
      const filtered = selectedBusiness === 'all' 
        ? fetchedAppointments 
        : fetchedAppointments.filter(app => app.businessId === selectedBusiness);
      
      setAppointments(filtered);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'שגיאה בטעינת התורים',
        description: 'לא ניתן לטעון את התורים כרגע, נסה שוב מאוחר יותר',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  // Navigate to the previous day
  const goToPreviousDay = () => {
    if (date) {
      const prevDay = new Date(date);
      prevDay.setDate(date.getDate() - 1);
      setDate(prevDay);
    }
  };

  // Navigate to the next day
  const goToNextDay = () => {
    if (date) {
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      setDate(nextDay);
    }
  };

  // Navigate to the previous week
  const goToPreviousWeek = () => {
    const prevWeekStart = new Date(weekStartDate);
    prevWeekStart.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(prevWeekStart);
  };

  // Navigate to the next week
  const goToNextWeek = () => {
    const nextWeekStart = new Date(weekStartDate);
    nextWeekStart.setDate(weekStartDate.getDate() + 7);
    setWeekStartDate(nextWeekStart);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Get week date range for display
  const getWeekDateRange = (): string => {
    const endDate = new Date(weekStartDate);
    endDate.setDate(weekStartDate.getDate() + 6);
    return `${formatDate(weekStartDate)} - ${formatDate(endDate)}`;
  };

  // Get day name
  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('he-IL', { weekday: 'long' });
  };

  // Generate time slots for the weekly view
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Get appointments for a specific day and time
  const getAppointmentsForDayAndTime = (day: Date, timeSlot: string): Appointment[] => {
    const dayString = day.toISOString().split('T')[0];
    return appointments.filter(app => {
      return app.date === dayString && app.time === timeSlot;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNewAppointmentChange = (field: string, value: any) => {
    setNewAppointment(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAppointment = async () => {
    // Validate required fields
    if (!newAppointment.title || !newAppointment.clientName || !newAppointment.clientPhone) {
      toast({
        title: 'שדות חסרים',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing && currentAppointmentId) {
        // Update existing appointment
        await updateAppointment(currentAppointmentId, newAppointment);
        toast({
          title: 'התור עודכן בהצלחה',
          description: 'פרטי התור עודכנו במערכת',
        });
      } else {
        // Create new appointment
        await createAppointment(newAppointment as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
        toast({
          title: 'התור נוצר בהצלחה',
          description: 'התור נוסף למערכת',
        });
      }
      
      // Close dialog and refresh appointments
      setIsDialogOpen(false);
      fetchAppointments();
      
      // Reset form
      setNewAppointment({
        title: '',
        date: date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        clientName: '',
        clientPhone: '',
        notes: '',
        businessId: selectedBusiness !== 'all' ? selectedBusiness : 'business-1'
      });
      setIsEditing(false);
      setCurrentAppointmentId(null);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: 'שגיאה בשמירת התור',
        description: 'לא ניתן לשמור את התור כרגע, נסה שוב מאוחר יותר',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditAppointment = (appointment: Appointment) => {
    setNewAppointment({
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      notes: appointment.notes || '',
      businessId: appointment.businessId
    });
    setIsEditing(true);
    setCurrentAppointmentId(appointment.id);
    setIsDialogOpen(true);
  };
  
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התור?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteAppointment(id);
      toast({
        title: 'התור נמחק בהצלחה',
        description: 'התור הוסר מהמערכת',
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'שגיאה במחיקת התור',
        description: 'לא ניתן למחוק את התור כרגע, נסה שוב מאוחר יותר',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 pt-24 pb-8">
          <div className="flex justify-center items-center h-full">
            <p className="text-xl">טוען...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto p-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold rtl">לוח תורים</h1>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="בחר עסק" />
                </SelectTrigger>
                <SelectContent>
                  {mockBusinesses.map(business => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  // Reset form when dialog is closed
                  setIsEditing(false);
                  setCurrentAppointmentId(null);
                  setNewAppointment({
                    title: '',
                    date: date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                    time: '09:00',
                    duration: 30,
                    clientName: '',
                    clientPhone: '',
                    notes: '',
                    businessId: selectedBusiness !== 'all' ? selectedBusiness : 'business-1'
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus size={16} />}
                    <span>תור חדש</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="rtl">{isEditing ? 'עריכת תור' : 'הוספת תור חדש'}</DialogTitle>
                    <DialogDescription className="rtl">
                      {isEditing ? 'ערוך את פרטי התור' : 'מלא את הפרטים להוספת תור חדש ללוח השנה'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">כותרת</Label>
                      <Input
                        id="title"
                        className="col-span-3 rtl"
                        value={newAppointment.title || ''}
                        onChange={(e) => handleNewAppointmentChange('title', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="business" className="text-right">עסק</Label>
                      <Select 
                        value={newAppointment.businessId || 'business-1'} 
                        onValueChange={(value) => handleNewAppointmentChange('businessId', value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="בחר עסק" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockBusinesses.filter(b => b.id !== 'all').map(business => (
                            <SelectItem key={business.id} value={business.id}>
                              {business.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="clientName" className="text-right">שם הלקוח</Label>
                      <Input
                        id="clientName"
                        className="col-span-3 rtl"
                        value={newAppointment.clientName || ''}
                        onChange={(e) => handleNewAppointmentChange('clientName', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="clientPhone" className="text-right">טלפון</Label>
                      <Input
                        id="clientPhone"
                        className="col-span-3 rtl"
                        value={newAppointment.clientPhone || ''}
                        onChange={(e) => handleNewAppointmentChange('clientPhone', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="time" className="text-right">שעה</Label>
                      <Input
                        id="time"
                        type="time"
                        className="col-span-3"
                        value={newAppointment.time || '09:00'}
                        onChange={(e) => handleNewAppointmentChange('time', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="duration" className="text-right">משך (דקות)</Label>
                      <Input
                        id="duration"
                        type="number"
                        className="col-span-3"
                        value={newAppointment.duration || 30}
                        onChange={(e) => handleNewAppointmentChange('duration', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="notes" className="text-right">הערות</Label>
                      <Textarea
                        id="notes"
                        className="col-span-3 rtl"
                        value={newAppointment.notes || ''}
                        onChange={(e) => handleNewAppointmentChange('notes', e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={handleAddAppointment} 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          שומר...
                        </>
                      ) : (
                        isEditing ? 'עדכן תור' : 'שמור תור'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="rtl">בחר תאריך</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="rtl">
                    {date ? date.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'לא נבחר תאריך'}
                  </CardTitle>
                  <CardDescription className="rtl">
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        טוען תורים...
                      </span>
                    ) : (
                      sortedAppointments.length > 0 
                        ? `${sortedAppointments.length} תורים מתוכננים` 
                        : 'אין תורים מתוכננים ליום זה'
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => {
                    if (date) {
                      const prevDay = new Date(date);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setDate(prevDay);
                    }
                  }}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => {
                    if (date) {
                      const nextDay = new Date(date);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setDate(nextDay);
                    }
                  }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sortedAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 rtl">אין תורים מתוכננים ליום זה</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      הוסף תור חדש
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAppointments.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg rtl">{appointment.title}</h3>
                              <p className="text-sm text-gray-500 rtl">
                                {appointment.time} - {calculateEndTime(appointment.time, appointment.duration)}
                                {' '} ({appointment.duration} דקות)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium rtl">{appointment.clientName}</p>
                              <p className="text-sm text-gray-500 rtl">{appointment.clientPhone}</p>
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm mt-2 p-2 bg-gray-50 rounded rtl">{appointment.notes}</p>
                          )}
                          <div className="flex justify-end mt-2 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAppointment(appointment)}
                              disabled={loading}
                            >
                              ערוך
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteAppointment(appointment.id!)}
                              disabled={loading}
                            >
                              בטל
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
}

export default Calendar;
