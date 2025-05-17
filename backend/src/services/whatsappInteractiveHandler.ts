import { sendWhatsAppMessage } from './whatsappService';
import { sendWhatsAppListMessage, sendEnhancedButtonMessage } from './whatsappListService';
import { getBusinessById } from './businessService';

/**
 * Process interactive message responses from WhatsApp
 * @param body The webhook request body
 * @returns Object with the type of interaction and details
 */
export function processInteractiveResponse(body: any) {
  try {
    // Check if this is an interactive message response
    if (body.ButtonText || body.SelectedId || body.ListId || body.ListTitle) {
      console.log('Received interactive message response:');
      console.log(JSON.stringify(body, null, 2));
      
      // Button response
      if (body.ButtonText) {
        console.log(`User clicked button: ${body.ButtonText}`);
        return {
          type: 'button',
          buttonText: body.ButtonText,
          buttonId: body.SelectedId,
          from: body.From?.replace('whatsapp:', '') || '',
          userPhone: body.WaId || body.From?.replace('whatsapp:+', '')
        };
      }
      
      // List response
      if (body.ListId || body.ListTitle) {
        console.log(`User selected list item: ${body.ListTitle}`);
        return {
          type: 'list',
          listId: body.ListId,
          listTitle: body.ListTitle,
          from: body.From?.replace('whatsapp:', '') || '',
          userPhone: body.WaId || body.From?.replace('whatsapp:+', '')
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing interactive response:', error);
    return null;
  }
}

/**
 * Handle interactive message responses based on the button/list ID
 * @param interactiveResponse The processed interactive response
 * @returns Promise resolving to boolean indicating success
 */
export async function handleInteractiveResponse(interactiveResponse: any): Promise<boolean> {
  try {
    if (!interactiveResponse) return false;
    
    const { type, from, userPhone } = interactiveResponse;
    
    // Handle button responses
    if (type === 'button') {
      const { buttonId, buttonText } = interactiveResponse;
      
      // Handle different button actions based on the ID
      switch (buttonId) {
        case 'appointment_confirm':
          await sendWhatsAppMessage(
            userPhone,
            'Great! Your appointment has been confirmed. We look forward to seeing you!'
          );
          return true;
          
        case 'appointment_cancel':
          await sendWhatsAppMessage(
            userPhone,
            'Your appointment has been cancelled. Would you like to reschedule?'
          );
          
          // Send follow-up buttons for rescheduling
          await sendEnhancedButtonMessage(
            userPhone,
            'Would you like to reschedule your appointment?',
            [
              { id: 'reschedule_yes', title: 'Yes, reschedule' },
              { id: 'reschedule_no', title: 'No, thanks' }
            ],
            'Reschedule Options'
          );
          return true;
          
        case 'reschedule_yes':
          await sendWhatsAppMessage(
            userPhone,
            'Please let us know what day and time works best for you, and we\'ll check our availability.'
          );
          return true;
          
        case 'reschedule_no':
          await sendWhatsAppMessage(
            userPhone,
            'No problem. Feel free to contact us whenever you\'d like to schedule a new appointment.'
          );
          return true;
          
        case 'services_info':
          // Send a list of services
          await sendWhatsAppListMessage(
            userPhone,
            'Here are our available services:',
            'View Services',
            [
              {
                title: 'Haircuts',
                items: [
                  { id: 'haircut_men', title: 'Men\'s Haircut', description: '30 minutes - $25' },
                  { id: 'haircut_women', title: 'Women\'s Haircut', description: '45 minutes - $40' }
                ]
              },
              {
                title: 'Coloring',
                items: [
                  { id: 'color_full', title: 'Full Color', description: '90 minutes - $80' },
                  { id: 'color_highlights', title: 'Highlights', description: '120 minutes - $120' }
                ]
              }
            ],
            'Our Services',
            'Select a service to learn more'
          );
          return true;
          
        case 'contact_info':
          await sendWhatsAppMessage(
            userPhone,
            'You can reach us at:\n\nPhone: (555) 123-4567\nEmail: info@example.com\nAddress: 123 Main St, Anytown, CA 12345\n\nOur hours are Monday-Friday 9am-7pm, Saturday 10am-5pm, closed Sunday.'
          );
          return true;
          
        default:
          console.log(`Unhandled button ID: ${buttonId}`);
          return false;
      }
    }
    
    // Handle list responses
    if (type === 'list') {
      const { listId, listTitle } = interactiveResponse;
      
      // Handle different list selections based on the ID
      switch (listId) {
        case 'haircut_men':
        case 'haircut_women':
        case 'color_full':
        case 'color_highlights':
          // Send service details and booking options
          await sendWhatsAppMessage(
            userPhone,
            `Thank you for your interest in our ${listTitle} service. Would you like to book an appointment?`
          );
          
          await sendEnhancedButtonMessage(
            userPhone,
            'Would you like to book this service now?',
            [
              { id: 'book_service', title: 'Book Now' },
              { id: 'services_info', title: 'Other Services' }
            ]
          );
          return true;
          
        default:
          console.log(`Unhandled list ID: ${listId}`);
          return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error handling interactive response:', error);
    return false;
  }
}

/**
 * Send a welcome message with interactive buttons
 * @param to Recipient phone number
 * @param businessName Business name to include in the welcome message
 * @returns Promise resolving to boolean indicating success
 */
export async function sendWelcomeMessage(to: string, businessName: string): Promise<boolean> {
  try {
    // Send welcome message with buttons
    const result = await sendEnhancedButtonMessage(
      to,
      `Welcome to ${businessName}! How can we assist you today?`,
      [
        { id: 'appointment_book', title: 'Book Appointment' },
        { id: 'services_info', title: 'Our Services' },
        { id: 'contact_info', title: 'Contact Info' }
      ],
      'Welcome!',
      'image',
      'https://example.com/logo.jpg', // Replace with your business logo URL
      'Tap a button below to get started'
    );
    
    return !!result;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return false;
  }
}

/**
 * Send appointment confirmation buttons
 * @param to Recipient phone number
 * @param appointmentDetails Details of the appointment
 * @returns Promise resolving to boolean indicating success
 */
export async function sendAppointmentConfirmation(
  to: string, 
  appointmentDetails: { 
    date: string, 
    time: string, 
    service: string 
  }
): Promise<boolean> {
  try {
    const { date, time, service } = appointmentDetails;
    
    // Send appointment confirmation with buttons
    const result = await sendEnhancedButtonMessage(
      to,
      `Your appointment for ${service} is scheduled for ${date} at ${time}. Would you like to confirm this appointment?`,
      [
        { id: 'appointment_confirm', title: 'Confirm' },
        { id: 'appointment_cancel', title: 'Cancel' },
        { id: 'appointment_reschedule', title: 'Reschedule' }
      ],
      'Appointment Confirmation',
      'text',
      undefined,
      'Please confirm your appointment'
    );
    
    return !!result;
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    return false;
  }
}
