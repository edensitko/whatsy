import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send a list-based interactive message to a WhatsApp user
 * @param to Recipient phone number
 * @param bodyText Main message body
 * @param buttonText Text for the list button
 * @param sections Array of list sections
 * @param headerText Optional header text
 * @param footerText Optional footer text
 * @returns Promise resolving to the message SID or false if failed
 */
export async function sendWhatsAppListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: {
    title: string,
    items: { id: string, title: string, description?: string }[]
  }[],
  headerText?: string,
  footerText?: string
): Promise<string | false> {
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

    // Format the from number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    // Check if the 'to' and 'from' numbers are the same
    if (cleanNumber === fromNumber) {
      console.log(`[WARNING] Cannot send message: 'to' and 'from' numbers are the same (${cleanNumber})`);
      console.log(`[MOCK] List message would be sent to ${cleanNumber}:`);
      console.log(`[MOCK] ${bodyText}`);
      console.log(`[MOCK] Sections: ${JSON.stringify(sections)}`);
      return false;
    }

    // Create the message payload
    const messagePayload: any = {
      from: formattedFrom,
      to: formattedTo,
      interactive: {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    };

    // Add header if provided
    if (headerText) {
      messagePayload.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    // Add footer if provided
    if (footerText) {
      messagePayload.interactive.footer = {
        text: footerText
      };
    }

    // Initialize Twilio client
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Send the message
    const message = await client.messages.create(messagePayload);
    
    console.log(`Sent interactive list message to ${cleanNumber}, SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('Error sending WhatsApp list message:', error);
    return false;
  }
}

/**
 * Send an enhanced button message with more customization options
 * @param to Recipient phone number
 * @param bodyText Main message body
 * @param buttons Array of button objects (max 3)
 * @param headerText Optional header text
 * @param headerType Optional header type (text, image, document, video)
 * @param headerUrl Optional URL for media header
 * @param footerText Optional footer text
 * @returns Promise resolving to the message SID or false if failed
 */
export async function sendEnhancedButtonMessage(
  to: string,
  bodyText: string,
  buttons: { id: string, title: string }[],
  headerText?: string,
  headerType: 'text' | 'image' | 'document' | 'video' = 'text',
  headerUrl?: string,
  footerText?: string
): Promise<string | false> {
  try {
    // Validate button count
    if (buttons.length > 3) {
      console.error('WhatsApp only supports up to 3 buttons');
      buttons = buttons.slice(0, 3);
    }

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

    // Format the from number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    // Format buttons for Twilio
    const formattedButtons = buttons.map(button => ({
      type: 'reply',
      reply: {
        id: button.id,
        title: button.title
      }
    }));

    // Create the message payload
    const messagePayload: any = {
      from: formattedFrom,
      to: formattedTo,
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: formattedButtons
        }
      }
    };

    // Add header if provided
    if (headerText || headerUrl) {
      if (headerType === 'text' && headerText) {
        messagePayload.interactive.header = {
          type: 'text',
          text: headerText
        };
      } else if (headerUrl && (headerType === 'image' || headerType === 'document' || headerType === 'video')) {
        messagePayload.interactive.header = {
          type: headerType,
          [headerType]: {
            link: headerUrl
          }
        };
      }
    }

    // Add footer if provided
    if (footerText) {
      messagePayload.interactive.footer = {
        text: footerText
      };
    }

    // Initialize Twilio client
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Send the message
    const message = await client.messages.create(messagePayload);
    
    console.log(`Sent enhanced button message to ${cleanNumber}, SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('Error sending enhanced button message:', error);
    return false;
  }
}

/**
 * Send a template message (for use outside the 24-hour window)
 * @param to Recipient phone number
 * @param templateName Name of the approved template
 * @param languageCode Language code (e.g., 'en_US')
 * @param components Template components (header, body, buttons)
 * @returns Promise resolving to the message SID or false if failed
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  components: any[] = []
): Promise<string | false> {
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

    // Format the from number for Twilio
    const formattedFrom = `whatsapp:+${fromNumber}`;

    // Create the message payload
    const messagePayload = {
      from: formattedFrom,
      to: formattedTo,
      contentSid: undefined,
      contentVariables: JSON.stringify({
        1: 'value1',
        2: 'value2'
      }),
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    };

    // Initialize Twilio client
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Send the message
    const message = await client.messages.create(messagePayload);
    
    console.log(`Sent template message to ${cleanNumber}, SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error('Error sending template message:', error);
    return false;
  }
}
