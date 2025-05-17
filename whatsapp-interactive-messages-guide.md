# Implementing Custom Messages and Interactive Buttons in WhatsApp

This guide will help you implement custom messages and interactive buttons in your WhatsApp integration using Twilio's API.

## Custom Messages

### Types of Messages You Can Send

1. **Text Messages**: Simple text messages
2. **Media Messages**: Images, documents, audio, video
3. **Template Messages**: Pre-approved message templates
4. **Interactive Messages**: Messages with buttons and list options

## Implementing Interactive Buttons

WhatsApp supports two types of interactive messages:
- **Button-based messages**: Up to 3 buttons
- **List-based messages**: A dropdown list of options

Let's implement both in your backend:

### 1. Update Your WhatsApp Service

First, let's examine your existing WhatsApp service to see how to enhance it:

```typescript
// Add this function to your whatsappService.ts file

/**
 * Send an interactive message with buttons to a WhatsApp user
 * @param to Recipient phone number with WhatsApp formatting
 * @param headerText Optional header text
 * @param bodyText Main message body
 * @param footerText Optional footer text
 * @param buttons Array of button objects (max 3)
 */
export async function sendWhatsAppButtonMessage(
  to: string,
  bodyText: string,
  buttons: { id: string, title: string }[],
  headerText?: string,
  footerText?: string
) {
  try {
    // Validate button count
    if (buttons.length > 3) {
      console.error('WhatsApp only supports up to 3 buttons');
      buttons = buttons.slice(0, 3);
    }

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
      from: `whatsapp:${process.env.WHATSAPP_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body: bodyText,
      contentSid: undefined,
      contentVariables: undefined,
      messagingServiceSid: undefined,
      persistentAction: undefined,
      scheduleType: undefined,
      sendAt: undefined,
      scheduleTime: undefined,
      sendAsMms: undefined,
      validityPeriod: undefined,
      smartEncoded: undefined,
      forceDelivery: undefined,
      contentRetention: undefined,
      addressRetention: undefined,
      statusCallback: undefined,
      maxPrice: undefined,
      provideFeedback: undefined,
      attempt: undefined,
      validityPeriod: undefined,
      pathAccountSid: undefined,
      pathMessageSid: undefined,
      applicationSid: undefined,
      mediaUrl: undefined,
      shortCode: undefined,
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

    // Send the message
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create(messagePayload);
    
    console.log(`Sent interactive button message to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp button message:', error);
    throw error;
  }
}

/**
 * Send a list-based interactive message to a WhatsApp user
 * @param to Recipient phone number
 * @param headerText Optional header text
 * @param bodyText Main message body
 * @param footerText Optional footer text
 * @param buttonText Text for the list button
 * @param sections Array of list sections
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
) {
  try {
    // Create the message payload
    const messagePayload: any = {
      from: `whatsapp:${process.env.WHATSAPP_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
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

    // Send the message
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create(messagePayload);
    
    console.log(`Sent interactive list message to ${to}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp list message:', error);
    throw error;
  }
}
```

### 2. Handle Button Responses

Now, let's update your webhook handler to process button responses:

```typescript
// Add this to your whatsapp.ts route file

// Process interactive message responses
function processInteractiveResponse(body: any) {
  try {
    if (body.ButtonText || body.SelectedId || body.ListId) {
      console.log('Received interactive message response:');
      
      // Button response
      if (body.ButtonText) {
        console.log(`User clicked button: ${body.ButtonText}`);
        return {
          type: 'button',
          buttonText: body.ButtonText,
          buttonId: body.SelectedId
        };
      }
      
      // List response
      if (body.ListId) {
        console.log(`User selected list item: ${body.ListTitle}`);
        return {
          type: 'list',
          listId: body.ListId,
          listTitle: body.ListTitle
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing interactive response:', error);
    return null;
  }
}

// Update your existing webhook handler to include this
router.post('/', async (req, res) => {
  try {
    // ... your existing code ...
    
    // Check if this is an interactive message response
    const interactiveResponse = processInteractiveResponse(req.body);
    if (interactiveResponse) {
      // Handle the interactive response based on the button/list ID
      // For example:
      if (interactiveResponse.type === 'button') {
        switch (interactiveResponse.buttonId) {
          case 'appointment_yes':
            // Handle appointment confirmation
            await sendWhatsAppMessage(
              req.body.From.replace('whatsapp:', ''),
              'Great! Your appointment has been confirmed.'
            );
            break;
            
          case 'appointment_no':
            // Handle appointment rejection
            await sendWhatsAppMessage(
              req.body.From.replace('whatsapp:', ''),
              'No problem. Would you like to reschedule?'
            );
            break;
            
          // Add more button handlers as needed
        }
      }
    }
    
    // ... rest of your code ...
  } catch (error) {
    // ... error handling ...
  }
});
```

## Example Usage

### Sending a Button Message

```typescript
// Example: Sending appointment confirmation buttons
await sendWhatsAppButtonMessage(
  customerPhoneNumber,
  'Would you like to confirm your appointment for tomorrow at 2:00 PM?',
  [
    { id: 'appointment_yes', title: 'Yes, confirm' },
    { id: 'appointment_no', title: 'No, cancel' },
    { id: 'appointment_reschedule', title: 'Reschedule' }
  ],
  'Appointment Confirmation',
  'Reply with your selection'
);
```

### Sending a List Message

```typescript
// Example: Sending service options
await sendWhatsAppListMessage(
  customerPhoneNumber,
  'Please select a service:',
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
  'Tap the button below to view our services'
);
```

## Important Notes

1. **Message Templates**: For non-session messages (messages sent outside the 24-hour window), you must use pre-approved templates.

2. **Button Limitations**: WhatsApp only allows up to 3 buttons per message.

3. **List Limitations**: Lists can have up to 10 items.

4. **Testing**: Always test your interactive messages in the Twilio sandbox before using them in production.

5. **Handling Responses**: Make sure your webhook properly handles all possible button and list responses.

## Next Steps

1. Implement these functions in your backend
2. Test with your WhatsApp sandbox
3. Create message templates for your business communications
4. Apply for WhatsApp Business API access for production use
