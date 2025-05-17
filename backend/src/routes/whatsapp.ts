import express from 'express';
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
} from '../services/whatsappInteractiveHandler';
import twilio from 'twilio';
import { generateChatResponse } from '../services/openaiService';
import { getBusinessByPhoneNumber, getAllBusinesses, getBusinessById } from '../services/businessService';
import { extractAppointmentDetails } from '../utils/appointmentExtractor';

// Declare global type for processedMessages and processedResponses
declare global {
  var processedMessages: Map<string, number>;
  var processedResponses: Map<string, { timestamp: number, content: string }>;
}

// Initialize the global processed messages cache
if (!global.processedMessages) {
  global.processedMessages = new Map<string, number>();
}

// Initialize the global processed responses cache to prevent duplicate responses
if (!global.processedResponses) {
  global.processedResponses = new Map<string, { timestamp: number, content: string }>();
}

const router = express.Router();

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log('WhatsApp Route - Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Headers:', JSON.stringify(req.headers, null, 2));
  console.log('- Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Function to process WhatsApp webhook for Netlify Functions
export async function processWhatsAppWebhook(body: any): Promise<boolean> {
  try {
    console.log('Processing WhatsApp webhook:', JSON.stringify(body, null, 2));
    
    // Check if this is a status update message (not a user message)
    if ((body.MessageStatus || body.SmsStatus) && !body.Body) {
      console.log(`Received status update: ${body.MessageStatus || body.SmsStatus}`);
      return true; // Successfully processed status update
    }
    
    // Handle error notification format (when Twilio sends error notifications)
    if (body.Level && body.Payload) {
      console.log(`Received ${body.Level} notification from Twilio`);
      try {
        // Try to parse the payload to get the original request
        const payload = JSON.parse(body.Payload);
        if (payload.webhook && payload.webhook.request && payload.webhook.request.parameters) {
          // Extract the original request parameters
          body = payload.webhook.request.parameters;
          console.log('Extracted original request parameters:', JSON.stringify(body, null, 2));
          
          // Check if this is a status update (not a user message)
          if ((body.MessageStatus || body.SmsStatus) && !body.Body) {
            console.log(`Extracted status update: ${body.MessageStatus || body.SmsStatus}`);
            return true; // Successfully processed status update
          }
        }
      } catch (error) {
        console.error('Failed to parse payload:', error);
        return false;
      }
    }
    
    // Extract data from the request body
    const from = body.From || body.from || '';
    const to = body.To || body.to || '';
    const messageBody = body.Body || body.body || '';
    const messageSid = body.MessageSid || body.message_sid || '';
    
    // Check if this is a button response
    const buttonText = body.ButtonText || '';
    const buttonId = buttonText.startsWith('business_') ? buttonText : '';
    
    console.log(`From: ${from}, To: ${to}, Body: ${messageBody}, SID: ${messageSid}`);
    console.log(`ButtonText: ${buttonText}, ButtonId: ${buttonId}`);
    
    if (!from) {
      console.log('Missing sender information (From)');
      return false;
    }
    
    if (!messageBody) {
      console.log('Missing message body');
      // Still continue processing as this might be a status update or other type of message
    }
    
    // Handle button response for business selection
    if (buttonId) {
      // Extract business ID from button ID (format: business_XXXX)
      const businessIdFromButton = buttonId.substring(9);
      console.log(`User selected business via button, ID: ${businessIdFromButton}`);
      
      // Find the business by ID
      const selectedBusiness = await getBusinessById(businessIdFromButton);
      if (selectedBusiness) {
        // Store the user session with this business
        storeUserSession(from, selectedBusiness.phone_number, selectedBusiness.id);
        
        // Create an introduction message with business summary
        const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
        
        // Create a welcome message with business details
        let welcomeMessage = '';
        
        if (selectedBusiness.name === 'רדאפ מערכות') {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `פתרונות טכנולוגיים לעסקים בעזרת שילוב בינה מלאכותית חכמה מערכות ואתרים`;
        } else if (isHebrew) {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `${selectedBusiness.description || ''}`;
        } else {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `${selectedBusiness.description || ''}`;
        }
        
        // Send the welcome message
        await sendWhatsAppMessage(from, welcomeMessage);
        
        // Generate and send an opening message using OpenAI
        const apiKey = process.env.OPENAI_API_KEY || '';
        if (apiKey) {
          try {
            // Create a system prompt for the opening message
            const openingPrompt = `You are the virtual assistant for ${selectedBusiness.name}. 
            Create a very brief, friendly opening message (1-2 sentences) introducing yourself as the assistant for this business.
            If the business name is in Hebrew, respond in Hebrew. Otherwise respond in English.
            
            IMPORTANT: 
            - Do not use any placeholders like {business_name}, {description}, or {hours} in your response
            - Do not ask how you can help - just introduce yourself
            - Keep it very brief (1-2 sentences maximum)
            - Make sure all information is properly filled in with actual values
            - Do NOT include template placeholders in your response`;
            
            // Generate the opening message
            const openingMessage = await generateChatResponse("generate opening message", from, openingPrompt, apiKey);
            
            // Verify the message doesn't contain template placeholders
            if (openingMessage.includes('{') && openingMessage.includes('}')) {
              console.error('Opening message contains template placeholders, not sending it');
            } else {
              // Send the opening message after a short delay
              setTimeout(async () => {
                await sendWhatsAppMessage(from, openingMessage);
              }, 1000);
            }
          } catch (error) {
            console.error('Error generating opening message:', error);
          }
        }
        
        return true;
      }
    }
    
    console.log('Received message from:', from);
    
    // Check if the user has already selected a business
    const userSession = getUserSession(from);
    const hasSelectedBusiness = userSession && userSession.businessId && userSession.businessId.trim() !== '';
    
    console.log(`User session for ${from}:`, userSession);
    console.log(`Has selected business: ${hasSelectedBusiness ? userSession.businessId : 'No'}`);
    
    // Handle commands that work regardless of business selection
    const lowerCaseMessage = messageBody.toLowerCase().trim();
    
    // Check for help command
    if (lowerCaseMessage === 'help' || lowerCaseMessage === 'עזרה') {
      console.log('User requested help');
      
      // Detect if the message is in Hebrew
      const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
      
      // Prepare help message
      let helpText;
      if (isHebrew) {
        helpText = `הנה הפקודות הזמינות:
- שלח מספר (למשל "1") כדי לבחור עסק
- שלח "החלף" כדי לחזור לרשימת העסקים
- שלח "עזרה" כדי לראות הודעה זו`;
      } else {
        helpText = `Here are the available commands:
- Send a number (e.g. "1") to select a business
- Send "switch" to return to the business list
- Send "help" to see this message`;
      }
      
      await sendWhatsAppMessage(from, helpText);
      return true;
    }
    
    // Check for switch command to change business
    if (
      lowerCaseMessage === 'switch' || 
      lowerCaseMessage === 'החלף' || 
      lowerCaseMessage === 'change' || 
      lowerCaseMessage === 'change business' || 
      lowerCaseMessage === 'החלף עסק' ||
      lowerCaseMessage === 'exit' ||
      lowerCaseMessage === 'יציאה'
    ) {
      console.log('User requested to switch/change business');
      
      // Clear the user session
      storeUserSession(from, '', '');
      
      // Get all businesses to display the selection menu again
      const allBusinesses = await getAllBusinesses();
      
      // Check if the message contains a number that could be selecting a business
      let businessIndex = -1;
      
      // Try to parse as a simple number
      if (/^\d+$/.test(messageBody.trim())) {
        businessIndex = parseInt(messageBody.trim()) - 1;
      } 
      // Try to extract a number from text like "מספר 1" or "number 1"
      else {
        const numberMatch = messageBody.match(/(?:מספר|number|#|no\.?|מס'?)\s*(\d+)/i);
        if (numberMatch && numberMatch[1]) {
          businessIndex = parseInt(numberMatch[1]) - 1;
        }
      }
      
      // Check if the user is selecting a business by number
      if (!isNaN(businessIndex) && businessIndex >= 0 && businessIndex < allBusinesses.length) {
        // User is selecting a business by number
        const selectedBusiness = allBusinesses[businessIndex];
        console.log(`User selected business #${businessIndex + 1}: ${selectedBusiness.name}`);
        
        // Store the user session with this business
        storeUserSession(from, selectedBusiness.phone_number, selectedBusiness.id);
        
        // Create an introduction message with business summary
        const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
        
        // Skip sending a separate welcome message with business details
        // The opening message from OpenAI will be sufficient
        
        // Generate and send an opening message using OpenAI
        const apiKey = process.env.OPENAI_API_KEY || '';
        if (apiKey) {
          try {
            // Create a system prompt for the opening message
            const openingPrompt = `You are the virtual assistant for ${selectedBusiness.name}. 
            Create a very brief, friendly opening message (1-2 sentences) introducing yourself as the assistant for this business.
            If the business name is in Hebrew, respond in Hebrew. Otherwise respond in English.
            
            IMPORTANT: 
            - Do not use any placeholders like {business_name}, {description}, or {hours} in your response
            - Do not ask how you can help - just introduce yourself
            - Keep it very brief (1-2 sentences maximum)
            - Make sure all information is properly filled in with actual values
            - Do NOT include template placeholders in your response`;
            
            // Generate the opening message
            const openingMessage = await generateChatResponse("generate opening message", from, openingPrompt, apiKey);
            
            // Verify the message doesn't contain template placeholders
            if (openingMessage.includes('{') && openingMessage.includes('}')) {
              console.error('Opening message contains template placeholders, not sending it');
            } else {
              // Send the opening message after a short delay
              setTimeout(async () => {
                await sendWhatsAppMessage(from, openingMessage);
              }, 1000);
            }
          } catch (error) {
            console.error('Error generating opening message:', error);
          }
        }
        
        return true;
      }
      
      // Detect if the message is in Hebrew
      const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
      
      // Prepare help message
      let helpMessage;
      if (isHebrew) {
        helpMessage = `בחרת להחליף עסק. אנא בחר עסק לשוחח איתו מהרשימה הבאה על ידי שליחת המספר המתאים:`;
      } else {
        helpMessage = `You've chosen to switch businesses. Please select a business to chat with from the list below by sending the corresponding number:`;
      }
      
      // Create a numbered list of businesses - only showing names
      const businessOptions = allBusinesses.map((b, index) => 
        `${index + 1}. ${b.name}`
      ).join('\n');
      
      // Add the business list to the message
      helpMessage += `\n\n${businessOptions}`;
      
      // Add instructions for navigation
      if (isHebrew) {
        helpMessage += `\n\nלדוגמה: פשוט שלח את הספרה "1" (ללא מירכאות) כדי לבחור את העסק הראשון.`;
        helpMessage += `\nאם אתה מתקשה בבחירה, נסה לשלוח "מספר 1" או "#1".`;
      } else {
        helpMessage += `\n\nFor example: Simply send the digit "1" (without quotes) to select the first business.`;
        helpMessage += `\nIf you're having trouble, try sending "number 1" or "#1".`;
      }
      
      console.log('Sending business selection message:', helpMessage);
      await sendWhatsAppMessage(from, helpMessage);
      
      return true;
    }
    
    // Check for navigation commands (next/previous business)
    if (lowerCaseMessage === 'next' || 
        lowerCaseMessage === 'הבא' || 
        lowerCaseMessage === 'הבא/ה' ||
        lowerCaseMessage === 'הבאה' ||
        lowerCaseMessage === 'previous' || 
        lowerCaseMessage === 'קודם' || 
        lowerCaseMessage === 'קודם/ת' ||
        lowerCaseMessage === 'קודמת') {
      
      console.log('User requested to navigate businesses');
      
      // Detect if the message is in Hebrew
      const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
      
      // Get all businesses
      const allBusinesses = await getAllBusinesses();
      
      if (allBusinesses.length === 0) {
        const noBusinessesMessage = isHebrew ? 
          'אין עסקים זמינים כרגע.' : 
          'No businesses available at the moment.';
        await sendWhatsAppMessage(from, noBusinessesMessage);
        return true;
      }
      
      // Initialize or get navigation state
      let updatedSession = { ...userSession };
      if (!updatedSession) {
        updatedSession = {
          businessPhone: '',
          businessId: '',
          lastMessageTime: Date.now(),
          messages: [],
          businessNavigation: {
            page: 0,
            pageSize: 5,
            totalBusinesses: allBusinesses.length
          }
        };
      }
      
      if (!updatedSession.businessNavigation) {
        updatedSession.businessNavigation = {
          page: 0,
          pageSize: 5,
          totalBusinesses: allBusinesses.length
        };
      }
      
      // Update navigation based on command
      const isNext = lowerCaseMessage === 'next' || 
                    lowerCaseMessage === 'הבא' || 
                    lowerCaseMessage === 'הבא/ה' ||
                    lowerCaseMessage === 'הבאה';
      
      if (isNext) {
        updatedSession.businessNavigation.page++;
        if (updatedSession.businessNavigation.page >= Math.ceil(allBusinesses.length / updatedSession.businessNavigation.pageSize)) {
          updatedSession.businessNavigation.page = 0; // Loop back to first page
        }
      } else {
        updatedSession.businessNavigation.page--;
        if (updatedSession.businessNavigation.page < 0) {
          updatedSession.businessNavigation.page = Math.ceil(allBusinesses.length / updatedSession.businessNavigation.pageSize) - 1; // Loop to last page
        }
      }
      
      // Store updated navigation state
      storeUserSession(from, updatedSession.businessPhone || '', updatedSession.businessId || '');
      
      // Calculate start and end indices for the current page
      const startIdx = updatedSession.businessNavigation.page * updatedSession.businessNavigation.pageSize;
      const endIdx = Math.min(startIdx + updatedSession.businessNavigation.pageSize, allBusinesses.length);
      const currentPageBusinesses = allBusinesses.slice(startIdx, endIdx);
      
      // Prepare message with businesses for the current page
      let navigationMessage;
      
      if (isHebrew) {
        navigationMessage = `עסקים ${startIdx + 1}-${endIdx} מתוך ${allBusinesses.length}:\n\n`;
      } else {
        navigationMessage = `Businesses ${startIdx + 1}-${endIdx} of ${allBusinesses.length}:\n\n`;
      }
      
      // Add the businesses for this page
      navigationMessage += currentPageBusinesses.map((b, idx) => 
        `${startIdx + idx + 1}. ${b.name} (${b.phone_number || ''})`
      ).join('\n');
      
      // Add navigation instructions
      if (isHebrew) {
        navigationMessage += `\n\nשלח את מספר העסק כדי לבחור, או "הבא"/"קודם" כדי לנווט בין העסקים.`;
      } else {
        navigationMessage += `\n\nSend the business number to select, or "next"/"previous" to navigate between businesses.`;
      }
      
      await sendWhatsAppMessage(from, navigationMessage);
      return true;
    }
    
    // Check for special commands
    if (lowerCaseMessage === 'debug' || 
        lowerCaseMessage === 'דיבאג' || 
        lowerCaseMessage.includes('send to chatgpt') || 
        lowerCaseMessage.includes('שלח לצאטגיפיטי') ||
        lowerCaseMessage.includes('שלח לצ׳אטגיפיטי') ||
        lowerCaseMessage.includes('שלח לצ\'אטגיפיטי')) {
      
      console.log('User requested debug information');
      
      // Detect if the message is in Hebrew
      const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
      
      // Get the business associated with this session
      let debugBusiness = null;
      if (hasSelectedBusiness) {
        debugBusiness = await getBusinessById(userSession.businessId);
      }
      
      // Check if user has a business selected
      if (!hasSelectedBusiness || !debugBusiness) {
        const message = isHebrew ? 
          'יש לבחור עסק לפני שימוש בפקודה זו.' : 
          'Please select a business before using this command.';
        await sendWhatsAppMessage(from, message);
        return true;
      }
      
      // Create a detailed debug message with all business information
      const debugMessage = `# מידע מלא על העסק: ${debugBusiness.name}

\`\`\`json
${JSON.stringify(debugBusiness, null, 2)}
\`\`\`

**כדי להשתמש במידע זה ב-ChatGPT:**
1. העתק את הטקסט הזה
2. הדבק אותו בשיחה עם ChatGPT
3. בקש מ-ChatGPT לעזור לך לנתח או לשפר את המידע

אם אתה רוצה לחזור לשיחה רגילה, פשוט שלח הודעה כלשהי שאינה פקודה מיוחדת.`;

      await sendWhatsAppMessage(from, debugMessage);
      return true;
    }
    
    // Process the incoming message
    const cleanedMessage = processWhatsAppMessage(messageBody);
    
    // Get the business associated with this session
    let currentBusiness = null;
    let isGeneralChatGPTMode = false;
    
    if (hasSelectedBusiness) {
      // Check if this is the special general ChatGPT mode
      if (userSession.businessId === 'general-chatgpt') {
        isGeneralChatGPTMode = true;
        console.log(`User is in general ChatGPT mode`);
      } else {
        currentBusiness = await getBusinessById(userSession.businessId);
        console.log(`Found business: ${currentBusiness?.name || 'Unknown'} (ID: ${userSession.businessId})`);
      }
    }
    
    if (!currentBusiness && !isGeneralChatGPTMode) {
      console.log('No business found for the current session and not in general ChatGPT mode');
      
      // If this is a direct message without a business selected,
      // provide a list of available businesses
      const allBusinesses = await getAllBusinesses();
      
      // Check if the message contains a number that could be selecting a business
      // Try different regex patterns to extract numbers
      let businessIndex = -1;
      
      // Check for "0" which indicates general ChatGPT mode
      if (messageBody.trim() === "0") {
        console.log("User selected general ChatGPT mode (0)");
        
        // Store a special session for general ChatGPT
        storeUserSession(from, 'general-chatgpt', 'general-chatgpt');
        
        // Detect language for the opening message
        const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
        
        // Send a welcome message for general ChatGPT mode
        const welcomeMessage = isHebrew ? 
          "מצב צ'אט כללי. אתה יכול לשאול אותי כל שאלה, ואני אענה כמו ChatGPT הרגיל, ללא קשר לעסק ספציפי." :
          "General chat mode. You can ask me any question, and I'll respond like regular ChatGPT, without being tied to a specific business.";
          
        await sendWhatsAppMessage(from, welcomeMessage);
        return true;
      }
      // Try to parse as a simple number
      else if (/^\d+$/.test(messageBody.trim())) {
        businessIndex = parseInt(messageBody.trim()) - 1;
      } 
      // Try to extract a number from text like "מספר 1" or "number 1"
      else {
        const numberMatch = messageBody.match(/(?:מספר|number|#|no\.?|מס'?)\s*(\d+)/i);
        if (numberMatch && numberMatch[1]) {
          businessIndex = parseInt(numberMatch[1]) - 1;
        }
      }
      
      console.log(`Checking if message "${messageBody}" is a business selection. Parsed index: ${businessIndex}`);
      
      if (!isNaN(businessIndex) && businessIndex >= 0 && businessIndex < allBusinesses.length) {
        // User is selecting a business by number
        const selectedBusiness = allBusinesses[businessIndex];
        console.log(`User selected business #${businessIndex + 1}: ${selectedBusiness.name}`);
        
        // Store the user session with this business
        storeUserSession(from, selectedBusiness.phone_number, selectedBusiness.id);
        
        // Create an introduction message with business summary
        const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
        
        // Create a welcome message with business details
        let welcomeMessage = '';
        
        if (selectedBusiness.name === 'רדאפ מערכות') {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `פתרונות טכנולוגיים לעסקים בעזרת שילוב בינה מלאכותית חכמה מערכות ואתרים`;
        } else if (isHebrew) {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `${selectedBusiness.description || ''}`;
        } else {
          welcomeMessage = `*${selectedBusiness.name}*\n\n`;
          welcomeMessage += `${selectedBusiness.description || ''}`;
        }
        
        // Send the welcome message
        await sendWhatsAppMessage(from, welcomeMessage);
        
        // Generate and send an opening message using OpenAI
        const apiKey = process.env.OPENAI_API_KEY || '';
        if (apiKey) {
          try {
            // Create a system prompt for the opening message
            const openingPrompt = `You are the virtual assistant for ${selectedBusiness.name}. 
            Create a very brief, friendly opening message (1-2 sentences) introducing yourself as the assistant for this business.
            If the business name is in Hebrew, respond in Hebrew. Otherwise respond in English.
            
            IMPORTANT: 
            - Do not use any placeholders like {business_name}, {description}, or {hours} in your response
            - Do not ask how you can help - just introduce yourself
            - Keep it very brief (1-2 sentences maximum)
            - Make sure all information is properly filled in with actual values
            - Do NOT include template placeholders in your response`;
            
            // Generate the opening message
            const openingMessage = await generateChatResponse("generate opening message", from, openingPrompt, apiKey);
            
            // Verify the message doesn't contain template placeholders
            if (openingMessage.includes('{') && openingMessage.includes('}')) {
              console.error('Opening message contains template placeholders, not sending it');
            } else {
              // Send the opening message after a short delay
              setTimeout(async () => {
                await sendWhatsAppMessage(from, openingMessage);
              }, 1000);
            }
          } catch (error) {
            console.error('Error generating opening message:', error);
          }
        }
        
        return true;
      }
      
      // Detect if the message is in Hebrew
      const isHebrew = /[\u0590-\u05FF]/.test(messageBody);
      
      // Prepare a welcome message with business selection instructions
      let welcomeMessage;
      if (isHebrew) {
        welcomeMessage = `שלום! אני הבוט העסקי שיעזור לך לתקשר עם העסקים שלנו.\n\nאנא בחר עסק לשוחח איתו מהרשימה הבאה על ידי שליחת המספר המתאים:\n\n0. צ'אט כללי`;
      } else {
        welcomeMessage = `Hello! I'm the business bot that will help you communicate with our businesses.\n\nPlease select a business to chat with from the list below by sending the corresponding number:\n\n0. General Chat `;
      }
      
      // Create a numbered list of businesses - only showing names
      const businessOptions = allBusinesses.map((b, index) => 
        `${index + 1}. ${b.name}`
      ).join('\n');
      
      // Add the business list to the message
      welcomeMessage += `\n\n${businessOptions}`;
      
      // No additional instructions - just the list of businesses
      
      console.log('Sending welcome message with business selection options:', welcomeMessage);
      await sendWhatsAppMessage(from, welcomeMessage);
      return true;
    }
    
    // Add the message to the user's session
    addMessageToSession(from, messageBody, 'user');
    
    // Get the user's conversation history
    const userConversation = getUserSession(from)?.messages || [];
    
    // Prepare the system prompt
    let systemPrompt = '';
    
    // Handle general ChatGPT mode differently than business mode
    if (isGeneralChatGPTMode) {
      // For general ChatGPT mode, use an empty system prompt to pass through directly to ChatGPT API
      systemPrompt = '';
      console.log('Using empty system prompt for direct ChatGPT API pass-through');
    } else if (currentBusiness) {
      // Business-specific mode
      // If there's a prompt template in the business data, use it as a base
      if (currentBusiness.prompt_template && currentBusiness.prompt_template.trim()) {
        // Use the prompt template directly, which already includes business hours
        systemPrompt = currentBusiness.prompt_template;
        
        // Log that we're using the prompt template
        console.log(`Using prompt template for business ${currentBusiness.id}: ${currentBusiness.prompt_template.substring(0, 100)}...`);
      } else {
        // Otherwise build a prompt from the business data
        systemPrompt = `You are an AI assistant for ${currentBusiness.name}, a business with the following details:
        
        Business Name: ${currentBusiness.name}
        Phone Number: ${currentBusiness.phone_number}
        Description: ${currentBusiness.description || 'Not provided'}
        
        שעות פעילות:
        ${formatBusinessHours(currentBusiness.hours)}`;
        
        // Log that we're building a prompt from scratch
        console.log(`Building prompt from scratch for business ${currentBusiness.id}`);
      }
      
      // Add standard instructions for the AI in business mode
      systemPrompt += `\n\nAnswer the user's questions about the business based on the information above.
      If you don't know the answer to a question, politely say so and suggest contacting the business directly.
      
      Keep your responses concise and friendly. If the user asks a question in Hebrew, respond in Hebrew.
      If the user asks a question in English, respond in English.
      
      IMPORTANT GUIDELINES:
      1. NEVER ask for clarification or say that a question is incomplete. Instead, provide the most relevant information about the business.
      2. Never respond with generic messages like "Your question number doesn't match a specific question".
      3. Always assume the user is asking about the business and provide useful information.
      4. If the user's message seems like a test or doesn't make sense, respond with information about the business's main services or hours.
      5. DO NOT add any reminders about switching businesses or changing to a different business.
      6. DO NOT include any confirmation messages about which business was selected.
      7. Keep responses short, direct and to the point. No need for pleasantries or asking if there's anything else.
      8. NEVER use template placeholders like {business_name}, {description}, or {hours} in your response.
      9. Always replace any placeholders with actual values before responding.
      10. If you notice your response contains placeholders (text within curly braces), do not send it.
      11. For questions about business hours, use the information provided in the prompt template above.
      12. The business hours for רדאפ מערכות are: Sunday-Thursday 09:00-17:00, Friday 09:00-14:00, Saturday closed.
      13. If asked about hours for a specific day, provide the exact hours for that day based on the information above.`;
    } else {
      // This should not happen, but handle it gracefully
      console.error('No business found and not in general ChatGPT mode - this is unexpected');
      await sendWhatsAppMessage(from, 'Sorry, there was an error processing your request. Please try again.');
      return false;
    }
    
    // Generate a response using OpenAI
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      await sendWhatsAppMessage(from, 'Sorry, I cannot generate a response at the moment. Please try again later.');
      return false;
    }
    
    // Create a unique key for this message to prevent duplicate responses
    // Using a combination of user phone number and message content
    const responseKey = `${from}:${messageBody}`;
    
    // Check if we've already sent a response for this exact message recently
    if (!global.processedResponses) {
      global.processedResponses = new Map<string, { timestamp: number, content: string }>();
    }
    
    const existingResponse = global.processedResponses.get(responseKey);
    if (existingResponse && (Date.now() - existingResponse.timestamp) < 10000) { // Within 10 seconds
      console.log(`Using cached response for message: "${messageBody}"`);
      console.log(`Cached response: ${existingResponse.content.substring(0, 50)}${existingResponse.content.length > 50 ? '...' : ''}`);
      return true; // Skip generating a new response
    }
    
    console.log('Generating response with OpenAI...');
    const response = await generateChatResponse(messageBody, from, systemPrompt, apiKey);
    
    console.log(`Generated response: ${response.substring(0, 50)}${response.length > 50 ? '...' : ''}`);
    
    // Store this response to prevent duplicates
    global.processedResponses.set(responseKey, {
      timestamp: Date.now(),
      content: response
    });
    
    // Send the response
    await sendWhatsAppMessage(from, response);
    
    return true;
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return false;
  }
}

// Function to format business hours
function formatBusinessHours(hours: any): string {
  // If hours is a string, return it directly
  if (typeof hours === 'string') {
    if (hours.trim() === '') {
      return 'Not provided';
    }
    return hours;
  } 
  // If hours is an object with day properties
  else if (typeof hours === 'object' && hours !== null) {
    const formattedHours = [];
    if (hours.monday) formattedHours.push(`יום שני: ${hours.monday}`);
    if (hours.tuesday) formattedHours.push(`יום שלישי: ${hours.tuesday}`);
    if (hours.wednesday) formattedHours.push(`יום רביעי: ${hours.wednesday}`);
    if (hours.thursday) formattedHours.push(`יום חמישי: ${hours.thursday}`);
    if (hours.friday) formattedHours.push(`יום שישי: ${hours.friday}`);
    if (hours.saturday) formattedHours.push(`יום שבת: ${hours.saturday}`);
    if (hours.sunday) formattedHours.push(`יום ראשון: ${hours.sunday}`);
    
    if (formattedHours.length > 0) {
      return formattedHours.join('\n');
    }
    return 'Not provided';
  } 
  // Default fallback
  else {
    return 'Not provided';
  }
}

// POST endpoint for receiving WhatsApp messages
router.post('/', async (req, res) => {
  try {
    // Verify that the request is coming from Twilio
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Get the URL that Twilio would have used to make the request
    // This is important for validation, especially when behind a proxy or using ngrok
    const forwardedProto = req.headers['x-forwarded-proto'] as string || req.protocol;
    const forwardedHost = req.headers['x-forwarded-host'] as string || req.get('host');
    const url = `${forwardedProto}://${forwardedHost}${req.originalUrl}`;
    
    // Log the verification details for debugging
    console.log('Verifying Twilio request:');
    console.log('- URL for validation:', url);
    console.log('- Original URL:', req.originalUrl);
    console.log('- Forwarded Proto:', forwardedProto);
    console.log('- Forwarded Host:', forwardedHost);
    console.log('- Twilio Signature:', twilioSignature);
    console.log('- Auth Token available:', !!authToken);
    
    // Skip validation in development mode if needed
    const skipValidation = process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_VALIDATION === 'true';
    
    if (!skipValidation && authToken && twilioSignature) {
      try {
        const requestIsValid = twilio.validateRequest(
          authToken,
          twilioSignature,
          url,
          req.body
        );
        
        if (!requestIsValid) {
          // Try with an alternate URL format as a fallback
          const alternateUrl = `https://${forwardedHost}${req.originalUrl}`;
          console.log('Trying alternate URL for validation:', alternateUrl);
          
          const alternateValid = twilio.validateRequest(
            authToken,
            twilioSignature,
            alternateUrl,
            req.body
          );
          
          if (!alternateValid) {
            console.error('Invalid Twilio signature with both URL formats. Setting SKIP_TWILIO_VALIDATION=true for development.');
            // Instead of rejecting, we'll proceed with caution in this implementation
            // return res.status(403).send('Forbidden: Invalid Twilio signature');
          } else {
            console.log('Twilio signature validated successfully with alternate URL');
          }
        } else {
          console.log('Twilio signature validated successfully');
        }
      } catch (error) {
        console.error('Error validating Twilio signature:', error);
      }
    } else if (!skipValidation) {
      console.warn('Missing Twilio signature or auth token. Proceeding with caution.');
    } else {
      console.log('Skipping Twilio validation in development mode');
    }
    
    // Always respond with 200 OK to Twilio to prevent retries
    // This is important because Twilio will keep retrying if it gets a non-200 response
    res.status(200).send('OK');
    
    // Check for duplicate messages using MessageSid
    const messageSid = req.body.MessageSid;
    if (messageSid) {
      // Use a simple in-memory cache to track processed messages
      // This helps prevent duplicate processing
      if (!global.processedMessages) {
        global.processedMessages = new Map<string, number>();
      }
      
      // Check if we've already processed this message
      if (global.processedMessages.has(messageSid)) {
        console.log(`Skipping duplicate message with SID: ${messageSid}`);
        return;
      }
      
      // Mark this message as processed
      global.processedMessages.set(messageSid, Date.now());
      
      // Check if this is an interactive message response (button or list selection)
      const interactiveResponse = processInteractiveResponse(req.body);
      if (interactiveResponse) {
        console.log('Processing interactive response:', JSON.stringify(interactiveResponse));
        // Handle the interactive response
        await handleInteractiveResponse(interactiveResponse);
        return;
      }
      
      // Clean up old entries (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      for (const [sid, timestamp] of global.processedMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
          global.processedMessages.delete(sid);
        }
      }
      
      // Also clean up old processed responses
      if (global.processedResponses) {
        for (const [key, data] of global.processedResponses.entries()) {
          if (data.timestamp < fiveMinutesAgo) {
            global.processedResponses.delete(key);
          }
        }
      }
    }
    
    // Process the webhook asynchronously
    processWhatsAppWebhook(req.body)
      .then(success => {
        console.log(`Webhook processed ${success ? 'successfully' : 'with errors'}`);
      })
      .catch(error => {
        console.error('Error processing webhook asynchronously:', error);
      });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    // We've already sent a 200 response, so we don't need to send another one
  }
});

// Verification endpoint for Twilio to verify your webhook URL
router.get('/', (req, res) => {
  console.log('Received webhook verification request');
  
  // Verify that the request is coming from Twilio if a signature is present
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  if (twilioSignature) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    if (authToken) {
      const requestIsValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        url,
        {}
      );
      
      if (!requestIsValid) {
        console.error('Invalid Twilio signature on GET request');
        // Still return 200 for webhook verification but log the issue
      } else {
        console.log('Twilio signature on GET request validated successfully');
      }
    }
  }
  
  // Twilio expects a 200 OK response for verification
  res.status(200).send('Webhook verified');
});

// Route to restart the Twilio client
router.post('/restart-twilio', (req, res) => {
  try {
    console.log('Received request to restart Twilio client');
    const result = restartTwilioClient();
    console.log('Restart result:', result);
    return res.status(200).json({ message: result });
  } catch (error) {
    console.error('Error restarting Twilio client:', error);
    return res.status(500).json({ error: 'Failed to restart Twilio client' });
  }
});

// Store the latest mock message for testing
export let latestMockMessage = '';

// Endpoint to get the latest mock message
router.get('/logs/latest', (req, res) => {
  res.status(200).json({ mockMessage: latestMockMessage });
});

// Endpoint to simulate a WhatsApp response for the frontend chat demo
router.post('/simulate-response', async (req, res) => {
  try {
    const { message, businessId, botId, promptTemplate } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing required message field' });
    }
    
    console.log(`Simulating WhatsApp response for business ID: ${businessId}, message: ${message}`);
    
    // Get the business if we have a business ID
    let business = null;
    if (businessId) {
      business = await getBusinessById(businessId);
      if (!business) {
        console.log(`Business with ID ${businessId} not found`);
      }
    }
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Create an enhanced prompt that includes all business information
    let enhancedPrompt = promptTemplate || business.prompt_template || '';
    
    // Add business information to the prompt
    enhancedPrompt += `\n\nמידע על העסק:
שם העסק: ${business.name}
תיאור: ${business.description}
מספר טלפון: ${business.phone_number}
מספר וואטסאפ: ${business.whatsapp_number}

שעות פעילות:`;

    // Add business hours
    if (business.hours) {
      if (typeof business.hours === 'string') {
        enhancedPrompt += `\n${business.hours}`;
      } else {
        if (business.hours.monday) enhancedPrompt += `\nיום שני: ${business.hours.monday}`;
        if (business.hours.tuesday) enhancedPrompt += `\nיום שלישי: ${business.hours.tuesday}`;
        if (business.hours.wednesday) enhancedPrompt += `\nיום רביעי: ${business.hours.wednesday}`;
        if (business.hours.thursday) enhancedPrompt += `\nיום חמישי: ${business.hours.thursday}`;
        if (business.hours.friday) enhancedPrompt += `\nיום שישי: ${business.hours.friday}`;
        if (business.hours.saturday) enhancedPrompt += `\nיום שבת: ${business.hours.saturday}`;
        if (business.hours.sunday) enhancedPrompt += `\nיום ראשון: ${business.hours.sunday}`;
      }
    }
    
    // Add FAQ information
    enhancedPrompt += `\n\nשאלות ותשובות נפוצות:`;
    if (business.faq && business.faq.length > 0) {
      // Check the type of the first item to determine how to process the array
      const firstItem = business.faq[0];
      
      if (typeof firstItem === 'object' && firstItem !== null && 
          'question' in firstItem && 'answer' in firstItem) {
        // It's an array of FaqItem objects
        business.faq.forEach((faqItem: any, index: number) => {
          enhancedPrompt += `\nשאלה ${index + 1}: ${faqItem.question}`;
          enhancedPrompt += `\nתשובה ${index + 1}: ${faqItem.answer}\n`;
        });
      } else {
        // It's an array of strings
        business.faq.forEach((faqString: any, index: number) => {
          if (typeof faqString === 'string') {
            enhancedPrompt += `\nנושא ${index + 1}: ${faqString}`;
          }
        });
      }
    }
    
    // Add final instructions
    enhancedPrompt += `\n\nהנחיות חשובות:
1. אתה עוזר וירטואלי של ${business.name}.
2. ענה בצורה מנומסת ומקצועית.
3. השתמש במידע שסופק לך לעיל.
4. אם אתה לא יודע את התשובה, אמור שתבדוק ותחזור עם מידע.
5. השתמש בעברית בתשובות שלך.
6. ענה בקצרה וענייני.

שאלת הלקוח: ${message}`;
    
    console.log('Enhanced prompt:', enhancedPrompt);
    
    // Generate a response using OpenAI
    try {
      const response = await generateChatResponse(
        message, 
        'demo-user', 
        enhancedPrompt,
        process.env.OPENAI_API_KEY || business.openai_api_key
      );
      
      // Store this as the latest mock message
      latestMockMessage = response;
      
      return res.status(200).json({ response });
    } catch (error) {
      console.error('Error generating chat response:', error);
      
      // Fallback response if OpenAI fails
      const fallbackResponse = `תודה על פנייתך ל${business.name}. אנחנו נחזור אליך בהקדם.`;
      return res.status(200).json({ response: fallbackResponse });
    }
  } catch (error) {
    console.error('Error in simulate-response endpoint:', error);
    return res.status(500).json({ error: 'Error processing request' });
  }
});

// Export the router
export { router as whatsappRouter };
