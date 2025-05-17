import twilio from 'twilio';
import dotenv from 'dotenv';
import { generateChatResponse } from './openaiService';
import { whatsappRouter } from '../routes/whatsapp';

dotenv.config();

// Flag to use mock implementation instead of actual Twilio API
// Set to true for testing without hitting Twilio message limits
let useMockImplementation = false;

// Initialize Twilio client
let twilioClient: any = null;

// Initialize Twilio client
initializeTwilioClient();

/**
 * Initialize or reinitialize the Twilio client
 */
export function initializeTwilioClient(): void {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.log('Twilio credentials not found in environment variables. Using mock implementation.');
      useMockImplementation = true;
      return;
    }
    
    twilioClient = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully. Account status: active');
    useMockImplementation = false;
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
    console.log('Using mock implementation due to initialization error.');
    useMockImplementation = true;
  }
}

/**
 * Restart the Twilio client
 * @returns Success status message
 */
export function restartTwilioClient(): string {
  try {
    console.log('Restarting Twilio client...');
    twilioClient = null;
    initializeTwilioClient();
    
    if (useMockImplementation) {
      return 'Twilio client restarted in mock mode. Check your environment variables.';
    } else {
      return 'Twilio client restarted successfully.';
    }
  } catch (error) {
    console.error('Error restarting Twilio client:', error);
    return `Failed to restart Twilio client: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// In-memory storage for user sessions
interface UserSession {
  businessPhone: string;
  businessId: string;
  lastMessageTime: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  // Navigation state for business selection
  businessNavigation?: {
    page: number;
    pageSize: number;
    totalBusinesses: number;
  };
}

// Map of user phone numbers to their current sessions
const userSessions: Record<string, UserSession> = {};

/**
 * Store a user's session with a specific business
 * @param userPhone User's phone number
 * @param businessPhone Business phone number
 * @param businessId Business ID
 */
export function storeUserSession(userPhone: string, businessPhone: string, businessId: string): void {
  // Clean the phone number
  const cleanPhone = cleanPhoneNumber(userPhone);
  
  // Check if a session already exists
  const existingSession = userSessions[cleanPhone];
  
  // Check if the business is changing
  const isBusinessChanging = existingSession && existingSession.businessId !== businessId;
  
  if (existingSession) {
    // If the business is changing, clear the message history
    if (isBusinessChanging) {
      console.log(`Business changing for user ${cleanPhone} from ${existingSession.businessId} to ${businessId}. Clearing message history.`);
      existingSession.messages = [];
      
      // Also clear any cached responses for this user
      if (global.processedResponses) {
        const userPrefix = `${userPhone}:`;
        for (const [key, _] of global.processedResponses.entries()) {
          if (key.startsWith(userPrefix)) {
            global.processedResponses.delete(key);
          }
        }
      }
    }
    
    // Update the existing session
    existingSession.businessPhone = businessPhone;
    existingSession.businessId = businessId;
    existingSession.lastMessageTime = Date.now();
    console.log(`Updated session for user ${cleanPhone} with business phone ${businessPhone} and business ID ${businessId}`);
  } else {
    // Create a new session
    userSessions[cleanPhone] = {
      businessPhone,
      businessId,
      lastMessageTime: Date.now(),
      messages: []
    };
    console.log(`Created new session for user ${cleanPhone} with business phone ${businessPhone} and business ID ${businessId}`);
  }
}

/**
 * Add a message to a user's session history
 * @param userPhone User's phone number
 * @param message Message content
 * @param role Role of the message sender (user or assistant)
 */
export function addMessageToSession(
  userPhone: string, 
  message: string, 
  role: 'user' | 'assistant'
): void {
  // Clean the phone number
  const cleanPhone = cleanPhoneNumber(userPhone);
  
  // Get the session
  const session = userSessions[cleanPhone];
  
  if (session) {
    // Add the message to the session
    session.messages.push({
      role,
      content: message,
      timestamp: Date.now()
    });
    
    // Update the last message time
    session.lastMessageTime = Date.now();
    
    console.log(`Added ${role} message to session for user ${cleanPhone}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
  } else {
    console.log(`No session found for user ${cleanPhone}, message not stored`);
  }
}

/**
 * Get a user's current session
 * @param userPhone User's phone number
 * @returns User session or null if not found
 */
export function getUserSession(userPhone: string): UserSession | null {
  // Clean the phone number
  const cleanPhone = cleanPhoneNumber(userPhone);
  
  // Get the session
  const session = userSessions[cleanPhone];
  
  if (session) {
    // Update the last message time
    session.lastMessageTime = Date.now();
    return session;
  }
  
  return null;
}

/**
 * Get conversation history for a user
 * @param userPhone User's phone number
 * @returns Array of messages formatted for OpenAI or null if no history
 */
export function getConversationHistory(userPhone: string): Array<{role: 'user' | 'assistant', content: string}> | null {
  const session = getUserSession(userPhone);
  if (session && session.messages.length > 0) {
    // Return the messages in the format expected by OpenAI
    return session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  return null;
}

/**
 * Clean a phone number to use as a key
 * @param phoneNumber Phone number to clean
 * @returns Cleaned phone number
 */
function cleanPhoneNumber(phoneNumber: string): string {
  // Remove 'whatsapp:' prefix and any spaces
  return phoneNumber.replace('whatsapp:', '').replace(/\s+/g, '');
}

/**
 * Process incoming WhatsApp message
 * @param from Phone number that sent the message
 * @param message The message content
 * @param newBusinessPhone Optional business phone if this is a new conversation
 * @returns The associated business phone and cleaned message
 */
export async function processIncomingMessage(
  from: string,
  message: string,
  newBusinessPhone?: string
): Promise<{ businessPhone: string | null; cleanMessage: string }> {
  // Clean the message (remove business phone if present)
  const cleanMessage = message.replace(/businessPhone=[a-zA-Z0-9]+/, '').trim();
  
  // If this is a new conversation with a business phone
  if (newBusinessPhone) {
    storeUserSession(from, newBusinessPhone, '');
    addMessageToSession(from, cleanMessage, 'user');
    return { businessPhone: newBusinessPhone, cleanMessage };
  }
  
  // Existing conversation
  const session = getUserSession(from);
  if (session) {
    addMessageToSession(from, cleanMessage, 'user');
    return { businessPhone: session.businessPhone, cleanMessage };
  }
  
  // No session found
  return { businessPhone: null, cleanMessage };
}

/**
 * Process an incoming WhatsApp message
 * @param message The message to process
 * @returns The cleaned message
 */
export function processWhatsAppMessage(message: string): string {
  // Remove any business phone prefixes if present
  let cleanedMessage = message;
  
  // Remove "#business:XXXX" prefix if present
  if (cleanedMessage.startsWith('#business:')) {
    const parts = cleanedMessage.split(' ');
    parts.shift(); // Remove the first part (the business phone)
    cleanedMessage = parts.join(' ');
  }
  
  // Remove any other business phone formats if needed
  cleanedMessage = cleanedMessage.replace(/businessPhone=[a-zA-Z0-9]+\s*/, '').trim();
  
  console.log(`Processed message: "${message}" -> "${cleanedMessage}"`);
  return cleanedMessage;
}

/**
 * Send a WhatsApp message
 * @param to Recipient phone number
 * @param message Message to send
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    // Log the full message for debugging
    console.log(`[FULL RESPONSE] Sending message to ${to}:\n${message}`);

    // Clean and format the 'to' number for WhatsApp
    let cleanNumber = to.replace(/\s+/g, '');

    // If it already has the whatsapp: prefix, extract just the number part
    if (cleanNumber.startsWith('whatsapp:')) {
      cleanNumber = cleanNumber.substring(9); // Remove 'whatsapp:' prefix
    }

    // Remove the '+' if it exists
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }

    // Format for Twilio WhatsApp API
    const formattedTo = `whatsapp:+${cleanNumber}`;

    // Get the WhatsApp number from env
    const fromNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
    
    if (!fromNumber) {
      console.error('Error: WHATSAPP_PHONE_NUMBER is not set in environment variables');
      return false;
    }

    // Check if the 'to' and 'from' numbers are the same
    if (cleanNumber === fromNumber) {
      console.log(`[WARNING] Cannot send message: 'to' and 'from' numbers are the same (${cleanNumber})`);
      console.log(`[MOCK] Message would be sent to ${cleanNumber}:`);
      console.log(`[MOCK] ${message}`);
      return true;
    }

    // If using mock implementation, just log the message
    if (useMockImplementation) {
      // Create a more visually distinct mock message display
      console.log(`\n======= MOCK WHATSAPP MESSAGE =======`);
      console.log(`TO: ${cleanNumber}`);
      console.log(`FROM: ${fromNumber}`);
      console.log(`TIME: ${new Date().toISOString()}`);
      console.log(`MESSAGE:`);
      console.log(`${message}`);
      console.log(`======= END MOCK MESSAGE =======\n`);
      
      // Store the message for the test interface
      (whatsappRouter as any).latestMockMessage = message;
      
      // Store the message in the user's session if available
      const session = getUserSession(`whatsapp:+${cleanNumber}`);
      if (session) {
        console.log(`[MOCK] Message stored in session for user ${cleanNumber}`);
        addMessageToSession(`whatsapp:+${cleanNumber}`, message, 'assistant');
      }
      
      return true;
    }

    // Format the 'from' number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    console.log(`Sending message to ${formattedTo} from ${formattedFrom}`);
    
    // Check if Twilio client is initialized
    if (!twilioClient) {
      console.error('Error: Twilio client is not initialized');
      return false;
    }

    // Send the message using Twilio
    console.log('Calling Twilio API to send message...');
    const result = await twilioClient.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo
    });
    
    console.log(`Message sent successfully! Message SID: ${result.sid}`);
    console.log(`Message sent to ${cleanNumber}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    return true;

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    
    // Check for specific Twilio error codes
    if (error.code === 63038) {
      console.error('Daily message limit exceeded. Consider upgrading your Twilio account or using mock mode for testing.');
    } else if (error.code === 21211) {
      console.error('Invalid phone number format. Make sure the number includes country code.');
    } else if (error.code === 20003) {
      console.error('Authentication error. Check your Twilio credentials.');
    } else if (error.code === 21608) {
      console.error('The recipient is not a valid WhatsApp user or has not opted in.');
    }
    
    return false;
  }
}

/**
 * Send a typing indicator to a WhatsApp user
 * @param to Recipient phone number
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendTypingIndicator(to: string): Promise<boolean> {
  try {
    // Clean and format the 'to' number for WhatsApp
    let cleanNumber = to.replace(/\s+/g, '');

    // If it already has the whatsapp: prefix, extract just the number part
    if (cleanNumber.startsWith('whatsapp:')) {
      cleanNumber = cleanNumber.substring(9); // Remove 'whatsapp:' prefix
    }

    // Remove the '+' if it exists
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }

    // Format for Twilio WhatsApp API
    const formattedTo = `whatsapp:+${cleanNumber}`;

    // Get the WhatsApp number from env
    const fromNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
    
    if (!fromNumber) {
      console.error('Error: WHATSAPP_PHONE_NUMBER is not set in environment variables');
      return false;
    }

    // Check if the 'to' and 'from' numbers are the same
    if (cleanNumber === fromNumber) {
      console.log(`[WARNING] Cannot send typing indicator: 'to' and 'from' numbers are the same (${cleanNumber})`);
      return true;
    }

    // If using mock implementation, just log the action
    if (useMockImplementation) {
      console.log(`\n======= MOCK WHATSAPP TYPING INDICATOR =======`);
      console.log(`TO: ${cleanNumber}`);
      console.log(`FROM: ${fromNumber}`);
      console.log(`TIME: ${new Date().toISOString()}`);
      console.log(`ACTION: Typing indicator`);
      console.log(`======= END MOCK TYPING INDICATOR =======\n`);
      return true;
    }

    // Format the 'from' number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    console.log(`Sending typing indicator to ${formattedTo} from ${formattedFrom}`);
    
    // Check if Twilio client is initialized
    if (!twilioClient) {
      console.error('Error: Twilio client is not initialized');
      return false;
    }

    // Send the typing indicator using Twilio
    console.log('Calling Twilio API to send typing indicator...');
    
    // For WhatsApp, we use the Channel API to send typing indicators
    await twilioClient.messages.create({
      contentSid: 'HXf7b8f5c8a4c6e0b6f5c8a4c6e0b6f5c',  // This is a special content SID for typing indicators
      from: formattedFrom,
      to: formattedTo,
      contentVariables: JSON.stringify({
        typing: true
      })
    });
    
    console.log(`Typing indicator sent successfully to ${cleanNumber}`);
    return true;

  } catch (error: any) {
    console.error('Error sending typing indicator:', error);
    
    // Check for specific Twilio error codes
    if (error.code === 63038) {
      console.error('Daily message limit exceeded. Consider upgrading your Twilio account or using mock mode for testing.');
    } else if (error.code === 21211) {
      console.error('Invalid phone number format. Make sure the number includes country code.');
    } else if (error.code === 20003) {
      console.error('Authentication error. Check your Twilio credentials.');
    } else if (error.code === 21608) {
      console.error('The recipient is not a valid WhatsApp user or has not opted in.');
    }
    
    return false;
  }
}

/**
 * Send a WhatsApp interactive message with buttons
 * @param to Recipient phone number
 * @param message Message body text
 * @param buttons Array of button options (up to 3 buttons)
 * @returns Promise resolving to a boolean indicating success
 */
export async function sendWhatsAppInteractiveMessage(
  to: string, 
  message: string, 
  buttons: { id: string, title: string }[]
): Promise<boolean> {
  try {
    // Log the interactive message for debugging
    console.log(`[INTERACTIVE] Sending interactive message to ${to} with ${buttons.length} buttons`);
    
    // Clean and format the 'to' number for WhatsApp
    let cleanNumber = to.replace(/\s+/g, '');

    // If it already has the whatsapp: prefix, extract just the number part
    if (cleanNumber.startsWith('whatsapp:')) {
      cleanNumber = cleanNumber.substring(9); // Remove 'whatsapp:' prefix
    }

    // Remove the '+' if it exists
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }

    // Format for Twilio WhatsApp API
    const formattedTo = `whatsapp:+${cleanNumber}`;

    // Get the WhatsApp number from env
    const fromNumber = process.env.WHATSAPP_PHONE_NUMBER || '';
    
    if (!fromNumber) {
      console.error('Error: WHATSAPP_PHONE_NUMBER is not set in environment variables');
      return false;
    }

    // Check if the 'to' and 'from' numbers are the same
    if (cleanNumber === fromNumber) {
      console.log(`[WARNING] Cannot send message: 'to' and 'from' numbers are the same (${cleanNumber})`);
      console.log(`[MOCK] Interactive message would be sent to ${cleanNumber}:`);
      console.log(`[MOCK] ${message}`);
      console.log(`[MOCK] Buttons: ${JSON.stringify(buttons)}`);
      return true;
    }

    // If using mock implementation, just log the message
    if (useMockImplementation) {
      // Create a more visually distinct mock message display
      console.log(`\n======= MOCK WHATSAPP INTERACTIVE MESSAGE =======`);
      console.log(`TO: ${cleanNumber}`);
      console.log(`FROM: ${fromNumber}`);
      console.log(`TIME: ${new Date().toISOString()}`);
      console.log(`MESSAGE: ${message}`);
      console.log(`BUTTONS:`);
      buttons.forEach(button => {
        console.log(`- ${button.title} (ID: ${button.id})`);
      });
      console.log(`======= END MOCK MESSAGE =======\n`);
      
      // Store the message for the test interface
      (whatsappRouter as any).latestMockMessage = message;
      
      // Store the message in the user's session if available
      const session = getUserSession(`whatsapp:+${cleanNumber}`);
      if (session) {
        console.log(`[MOCK] Interactive message stored in session for user ${cleanNumber}`);
        addMessageToSession(`whatsapp:+${cleanNumber}`, message, 'assistant');
      }
      
      return true;
    }

    // Format the 'from' number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    console.log(`Sending interactive message to ${formattedTo} from ${formattedFrom}`);
    
    // Check if Twilio client is initialized
    if (!twilioClient) {
      console.error('Error: Twilio client is not initialized');
      return false;
    }

    // Prepare the interactive message with buttons
    // Note: WhatsApp allows up to 3 quick reply buttons
    const quickReplyButtons = buttons.slice(0, 3).map(button => ({
      type: 'reply',
      reply: {
        id: button.id,
        title: button.title
      }
    }));

    // Send the interactive message using Twilio
    console.log('Calling Twilio API to send interactive message...');
    const result = await twilioClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: message,
      contentSid: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // This needs to be replaced with your actual Content SID for interactive messages
      contentVariables: JSON.stringify({
        1: message,
        2: JSON.stringify(quickReplyButtons)
      })
    });
    
    console.log(`Interactive message sent successfully! Message SID: ${result.sid}`);
    return true;

  } catch (error: any) {
    console.error('Error sending WhatsApp interactive message:', error);
    
    // Check for specific Twilio error codes
    if (error.code === 63038) {
      console.error('Daily message limit exceeded. Consider upgrading your Twilio account or using mock mode for testing.');
    } else if (error.code === 21211) {
      console.error('Invalid phone number format. Make sure the number includes country code.');
    } else if (error.code === 20003) {
      console.error('Authentication error. Check your Twilio credentials.');
    } else if (error.code === 21608) {
      console.error('The recipient is not a valid WhatsApp user or has not opted in.');
    }
    
    return false;
  }
}
