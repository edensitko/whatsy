/**
 * Interface for appointment details
 */
export interface AppointmentDetails {
  name?: string;
  phone?: string;
  date?: string;
  time?: string;
  service?: string;
  notes?: string;
}

/**
 * Extract appointment details from a message
 * @param message The message to extract appointment details from
 * @returns Appointment details or null if none found
 */
export function extractAppointmentDetails(message: string): AppointmentDetails | null {
  // Convert to lowercase for case-insensitive matching
  const lowerMessage = message.toLowerCase();
  
  // Initialize appointment details
  const details: AppointmentDetails = {};
  
  // Check if this is likely an appointment request
  const appointmentKeywords = [
    'appointment', 'book', 'schedule', 'reserve', 'booking',
    'תור', 'פגישה', 'לקבוע', 'להזמין', 'שמירת מקום'
  ];
  
  const isAppointmentRequest = appointmentKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (!isAppointmentRequest) {
    return null;
  }
  
  // Extract name (look for patterns like "my name is [name]" or "this is [name]")
  const namePatterns = [
    /my name is ([a-zA-Z\s]+)/i,
    /this is ([a-zA-Z\s]+)/i,
    /i am ([a-zA-Z\s]+)/i,
    /name:?\s*([a-zA-Z\s]+)/i,
    /שמי ([א-ת\s]+)/i,
    /קוראים לי ([א-ת\s]+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      details.name = match[1].trim();
      break;
    }
  }
  
  // Extract phone number
  const phonePattern = /(\+?[\d\s\-\(\)]{7,})/;
  const phoneMatch = message.match(phonePattern);
  if (phoneMatch && phoneMatch[1]) {
    details.phone = phoneMatch[1].trim();
  }
  
  // Extract date
  const datePatterns = [
    // English date formats
    /on ([a-zA-Z]+day)/i, // e.g., "on Monday"
    /on the (\d+)(st|nd|rd|th)/i, // e.g., "on the 21st"
    /(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/i, // e.g., "12/25" or "12-25-2023"
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})(?:st|nd|rd|th)?/i, // e.g., "December 25th"
    /(\d{1,2})(?:st|nd|rd|th)? of (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i, // e.g., "25th of December"
    
    // Hebrew date formats
    /ב([א-ת]+) הקרוב/i, // e.g., "ביום ראשון הקרוב"
    /(\d{1,2})[\/\.](\d{1,2})/i, // e.g., "25/12"
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      if (match[0]) {
        details.date = match[0].trim();
        break;
      }
    }
  }
  
  // Extract time
  const timePatterns = [
    // English time formats
    /at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i, // e.g., "at 3pm" or "at 15:30"
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i, // e.g., "3pm" or "15:30"
    
    // Hebrew time formats
    /בשעה (\d{1,2}(?::\d{2})?)/i, // e.g., "בשעה 15:30"
  ];
  
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      details.time = match[1].trim();
      break;
    }
  }
  
  // Extract service type if present
  const servicePatterns = [
    /for (?:a|an) ([a-zA-Z\s]+) appointment/i,
    /book (?:a|an) ([a-zA-Z\s]+) appointment/i,
    /([a-zA-Z\s]+) service/i,
    /([a-zA-Z\s]+) consultation/i,
    /לשירות ([א-ת\s]+)/i,
    /ל([א-ת\s]+) תור/i,
  ];
  
  for (const pattern of servicePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      details.service = match[1].trim();
      break;
    }
  }
  
  // If we have at least one piece of appointment information, return the details
  if (details.name || details.phone || details.date || details.time || details.service) {
    return details;
  }
  
  return null;
}
