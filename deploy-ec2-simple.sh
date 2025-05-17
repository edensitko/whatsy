#!/bin/bash
set -e

echo "Deploying WhatsApp Interactive Features to EC2 (Simple Method)"
echo "============================================================="

# EC2 connection details
EC2_HOST="13.219.30.68"
EC2_USER="ubuntu"
KEY_PATH="$HOME/Downloads/mymymymy.pem"

# Create deployment directory
echo "Creating deployment files..."
mkdir -p ec2-deploy

# Create the service files in the deployment directory
cat > ec2-deploy/whatsappListService.ts << 'EOL'
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
EOL

cat > ec2-deploy/whatsappInteractiveHandler.ts << 'EOL'
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
EOL

# Create the remote deployment script
cat > ec2-deploy/remote-deploy.sh << 'EOL'
#!/bin/bash
set -e

echo "Deploying WhatsApp Interactive Features"
echo "======================================"

# Install required packages
echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y jq

# Get the container ID
CONTAINER_ID=$(docker ps -qf "name=whatsy-backend")

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: whatsy-backend container is not running"
  exit 1
fi

# Create directories in the container
echo "Creating directories in the container..."
docker exec $CONTAINER_ID mkdir -p /app/src/services

# Copy the new service files into the container
echo "Copying service files to the container..."
docker cp whatsappListService.ts $CONTAINER_ID:/app/src/services/
docker cp whatsappInteractiveHandler.ts $CONTAINER_ID:/app/src/services/

# Create the script to update the imports
cat > update-imports.js << 'EOF'
const fs = require('fs');
const path = '/app/src/routes/whatsapp.ts';

try {
  let content = fs.readFileSync(path, 'utf8');

  // Check if the file exists and has content
  if (!content) {
    console.error('Error: whatsapp.ts file is empty or does not exist');
    process.exit(1);
  }

  // Add the new imports if they don't exist
  if (!content.includes('whatsappListService')) {
    console.log('Adding new imports...');
    
    // Find the import section
    const importRegex = /import express from ['"]express['"];[\s\S]*?from ['"]\.\.\/services\/whatsappService['"];/;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const importSection = `import express from 'express';
import { 
  processWhatsAppMessage, 
  sendWhatsAppMessage, 
  getUserSession, 
  storeUserSession, 
  addMessageToSession,
  sendTypingIndicator,
  sendWhatsAppInteractiveMessage,
  restartTwilioClient
} from '../services/whatsappService';
import {
  sendWhatsAppListMessage,
  sendEnhancedButtonMessage,
  sendTemplateMessage
} from '../services/whatsappListService';
import {
  processInteractiveResponse,
  handleInteractiveResponse,
  sendWelcomeMessage,
  sendAppointmentConfirmation
} from '../services/whatsappInteractiveHandler';`;

      content = content.replace(importRegex, importSection);
    } else {
      console.error('Error: Could not find import section in whatsapp.ts');
    }
  }

  // Add the interactive response handling code if it doesn't exist
  if (!content.includes('processInteractiveResponse')) {
    console.log('Adding interactive response handling...');
    
    // Find the section where we process messages
    const targetRegex = /\/\/ Mark this message as processed[\s\S]*?global\.processedMessages\.set\(messageSid, Date\.now\(\)\);/;
    const targetMatch = content.match(targetRegex);
    
    if (targetMatch) {
      const replacementSection = `// Mark this message as processed
      global.processedMessages.set(messageSid, Date.now());
      
      // Check if this is an interactive message response (button or list selection)
      const interactiveResponse = processInteractiveResponse(req.body);
      if (interactiveResponse) {
        console.log('Processing interactive response:', JSON.stringify(interactiveResponse));
        // Handle the interactive response
        await handleInteractiveResponse(interactiveResponse);
        return;
      }`;

      content = content.replace(targetRegex, replacementSection);
    } else {
      console.error('Error: Could not find target section in whatsapp.ts');
    }
  }

  // Write the updated content back to the file
  fs.writeFileSync(path, content);
  console.log('WhatsApp router updated successfully!');
} catch (error) {
  console.error('Error updating whatsapp.ts:', error);
  process.exit(1);
}
EOF

# Copy the update script to the container
echo "Copying update script to the container..."
docker cp update-imports.js $CONTAINER_ID:/app/

# Run the update script in the container
echo "Running update script in the container..."
docker exec $CONTAINER_ID node /app/update-imports.js

# Restart the container to apply changes
echo "Restarting the container..."
docker restart $CONTAINER_ID

echo ""
echo "WhatsApp interactive features deployed successfully!"
echo "Your Twilio webhook URL is: https://$(hostname)/api/webhook/twilio"
echo ""
echo "To check the logs:"
echo "docker logs whatsy-backend"
EOL

# Make the remote deployment script executable
chmod +x ec2-deploy/remote-deploy.sh

# Copy the files to EC2
echo "Copying files to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r ec2-deploy/* $EC2_USER@$EC2_HOST:~/

# Run the deployment script on EC2
echo "Running deployment script on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "chmod +x remote-deploy.sh && ./remote-deploy.sh"

# Clean up local files
echo "Cleaning up local files..."
rm -rf ec2-deploy

echo ""
echo "Deployment completed!"
echo "Your WhatsApp backend with interactive features is now running on EC2."
echo "Twilio webhook URL: https://$EC2_HOST/api/webhook/twilio"
