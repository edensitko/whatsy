import React from 'react';
import { Button } from '@/components/ui/button';
import { AppointmentRequest } from '@/types';

interface AppointmentListProps {
  appointments: AppointmentRequest[];
  onUpdateStatus?: (appointmentId: string, newStatus: 'pending' | 'approved' | 'rejected') => void;
  onStatusChange?: (appointmentId: string, newStatus: 'pending' | 'approved' | 'rejected') => void;
}

const AppointmentList = ({ appointments, onUpdateStatus, onStatusChange }: AppointmentListProps) => {
  // Function to format date nicely
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Format phone number for display
  const formatPhone = (phone: string): string => {
    if (phone.startsWith('972')) {
      return '0' + phone.substring(3);
    }
    return phone;
  };

  // Use either onUpdateStatus or onStatusChange for backward compatibility
  const handleStatusChange = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    if (onUpdateStatus) {
      onUpdateStatus(id, status);
    } else if (onStatusChange) {
      onStatusChange(id, status);
    }
  };
  
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">אין בקשות לתורים כרגע</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rtl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 text-right">
            <th className="px-4 py-3 text-sm font-medium text-gray-500">לקוח</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">זמן מבוקש</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">סטטוס</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">תאריך בקשה</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appointment => (
            <tr key={appointment.id} className="border-t border-gray-100">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium">{formatPhone(appointment.customer_phone)}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{formatDateTime(appointment.requested_time)}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  appointment.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status === 'approved' ? 'מאושר' : 
                   appointment.status === 'rejected' ? 'נדחה' : 
                   'ממתין'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-600">{formatDateTime(appointment.created_at)}</div>
              </td>
              <td className="px-4 py-3">
                {appointment.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange(appointment.id, 'approved')}
                      className="ml-2"
                    >
                      אשר
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(appointment.id, 'rejected')}
                    >
                      דחה
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList;
