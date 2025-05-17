import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

// Response types to categorize different kinds of responses
enum ResponseType {
  GREETING = 'greeting',
  APPOINTMENT = 'appointment',
  HOURS = 'hours',
  PRICING = 'pricing',
  SERVICES = 'services',
  LOCATION = 'location',
  GENERAL = 'general',
  ERROR = 'error'
}

// Response templates for different types of messages
const responseTemplates: Record<ResponseType, {he: string, en: string}> = {
  [ResponseType.GREETING]: {
    he: 'שלום! אני הבוט האוטומטי של {business_name}. כיצד אוכל לעזור לך היום?',
    en: 'Hello! I\'m the automated assistant for {business_name}. How can I help you today?'
  },
  [ResponseType.APPOINTMENT]: {
    he: 'אשמח לעזור לך לקבוע פגישת ייעוץ. אוכל לדעת את השם שלך, פרטי התקשרות, והמועד המועדף עליך?',
    en: 'I\'d be happy to help you schedule a consultation. Could you please provide your name, contact information, and preferred time?'
  },
  [ResponseType.HOURS]: {
    he: 'שעות הפעילות שלנו הן:\n{business_hours}',
    en: 'Our business hours are:\n{business_hours}'
  },
  [ResponseType.PRICING]: {
    he: 'התוכניות שלנו מתחילות ב-99$ לחודש עבור התוכנית הבסיסית, עם תמחור מותאם אישית לפתרונות ארגוניים. האם תרצה מידע על שירות ספציפי?',
    en: 'Our services start at $99/month for basic plans, with custom pricing for enterprise solutions. Would you like information about a specific service?'
  },
  [ResponseType.SERVICES]: {
    he: 'אנחנו מציעים מגוון שירותים כולל:\n- פתרונות אוטומציה לעסקים\n- מערכות תמיכה בלקוחות\n- ניתוח נתונים ודיווח\n- פיתוח תוכנה מותאם אישית\n- אינטגרציה עם מערכות קיימות\nאיזה שירות מעניין אותך?',
    en: 'We offer a variety of services including:\n- Business automation solutions\n- Customer support systems\n- Data analytics and reporting\n- Custom software development\n- Integration with existing systems\nWhich service are you interested in?'
  },
  [ResponseType.LOCATION]: {
    he: 'המשרדים שלנו ממוקמים ברחוב רוטשילד 45, תל אביב. ניתן גם לקיים פגישות וירטואליות דרך Zoom או Teams.',
    en: 'Our offices are located at 45 Rothschild Blvd, Tel Aviv. We can also conduct virtual meetings via Zoom or Teams.'
  },
  [ResponseType.GENERAL]: {
    he: 'תודה על פנייתך ל{business_name}. איך אוכל לעזור לך היום? אנחנו מציעים {business_services}.',
    en: 'Thank you for contacting {business_name}. How can I help you today? We offer {business_services}.'
  },
  [ResponseType.ERROR]: {
    he: 'מצטער, לא הצלחתי להבין את בקשתך. האם תוכל לנסח אותה מחדש או לבחור מאחת האפשרויות הבאות: תיאום פגישה, שעות פעילות, מחירים, או שירותים?',
    en: 'I\'m sorry, I couldn\'t understand your request. Could you rephrase it or choose from one of the following options: scheduling a consultation, business hours, pricing, or services?'
  }
};

/**
 * Get a response from OpenAI's API with enhanced control
 * @param apiKey OpenAI API key
 * @param systemPrompt System prompt (instructions for the AI)
 * @param userMessage User's message
 * @param businessData Optional business data for template substitution
 * @returns Generated response and any error
 */
export async function getOpenAIResponse(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  businessData?: any
): Promise<{ content: string; error?: string }> {
  // Detect language (simplified version - just checking for Hebrew characters)
  const language = detectLanguage(userMessage);
  
  // If no API key is provided, use controlled mock responses
  if (!apiKey) {
    console.log('[MOCK] Using controlled mock response (no API key provided)');
    return getControlledResponse(userMessage, systemPrompt, language, businessData);
  }

  try {
    // Enhanced system prompt with more control
    const enhancedSystemPrompt = `${systemPrompt}\n\nIMPORTANT GUIDELINES:
1. Always be polite, professional, and helpful.
2. Keep responses concise and to the point.
3. When asked about appointments or consultations, always collect: name, contact information, and preferred time.
4. Never make up information that wasn't provided in this prompt.
5. If you're unsure about something, ask for clarification rather than guessing.
6. Format responses in a clean, readable way.
7. Respond in the same language as the user's message.
8. When discussing technical topics, provide practical examples where possible.
9. Be conversational but professional in tone.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using the latest model
        messages,
        temperature: 0.5, // Slightly more creative responses
        max_tokens: 600, // Increased token limit for more detailed responses
        top_p: 0.95, // Slightly more focused responses
        frequency_penalty: 0.5, // Reduce repetition
        presence_penalty: 0.5 // Encourage addressing all parts of the query
      })
    });

    const data: OpenAIResponse = await response.json();

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      // Fall back to controlled response if API fails
      return getControlledResponse(userMessage, systemPrompt, language, businessData);
    }

    const generatedContent = data.choices[0]?.message?.content || '';
    
    // Validate and sanitize the response
    const validatedResponse = validateAndSanitizeResponse(generatedContent, userMessage, language, businessData);
    
    return { content: validatedResponse };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fall back to controlled response if there's an exception
    return getControlledResponse(userMessage, systemPrompt, language, businessData);
  }
}

/**
 * Generate a controlled response based on message content
 * @param userMessage User's message
 * @param systemPrompt System prompt (for context)
 * @param language Detected language (he/en)
 * @param businessData Business data for template substitution
 * @returns Controlled response
 */
function getControlledResponse(
  userMessage: string, 
  systemPrompt: string, 
  language: 'he' | 'en',
  businessData?: any
): { content: string } {
  const lowerMessage = userMessage.toLowerCase();
  let responseType = ResponseType.GENERAL;
  
  // Determine response type based on message content
  if (
    lowerMessage.includes('תור') || 
    lowerMessage.includes('תספורת') || 
    lowerMessage.includes('צביעה') || 
    lowerMessage.includes('טיפול') ||
    lowerMessage.includes('appointment') ||
    lowerMessage.includes('book') ||
    lowerMessage.includes('schedule')
  ) {
    responseType = ResponseType.APPOINTMENT;
  } else if (
    lowerMessage.includes('שעות') || 
    lowerMessage.includes('פתוח') || 
    lowerMessage.includes('פתיחה') || 
    lowerMessage.includes('סגור') ||
    lowerMessage.includes('hours') ||
    lowerMessage.includes('open') ||
    lowerMessage.includes('closed')
  ) {
    responseType = ResponseType.HOURS;
  } else if (
    lowerMessage.includes('מחיר') || 
    lowerMessage.includes('עלות') || 
    lowerMessage.includes('תשלום') || 
    lowerMessage.includes('כמה עולה') ||
    lowerMessage.includes('price') ||
    lowerMessage.includes('cost') ||
    lowerMessage.includes('how much')
  ) {
    responseType = ResponseType.PRICING;
  } else if (
    lowerMessage.includes('שירות') ||
    lowerMessage.includes('מציע') ||
    lowerMessage.includes('עוש') ||
    lowerMessage.includes('service') ||
    lowerMessage.includes('offer') ||
    lowerMessage.includes('provide')
  ) {
    responseType = ResponseType.SERVICES;
  } else if (
    lowerMessage.includes('איפה') ||
    lowerMessage.includes('מיקום') ||
    lowerMessage.includes('כתובת') ||
    lowerMessage.includes('חניה') ||
    lowerMessage.includes('where') ||
    lowerMessage.includes('location') ||
    lowerMessage.includes('address') ||
    lowerMessage.includes('parking')
  ) {
    responseType = ResponseType.LOCATION;
  } else if (
    lowerMessage.includes('שלום') ||
    lowerMessage.includes('היי') ||
    lowerMessage.includes('בוקר טוב') ||
    lowerMessage.includes('ערב טוב') ||
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey') ||
    lowerMessage.includes('good morning') ||
    lowerMessage.includes('good evening')
  ) {
    responseType = ResponseType.GREETING;
  }
  
  // Get template for the response type
  const langKey = language as keyof typeof responseTemplates[ResponseType.GENERAL];
  let template = responseTemplates[responseType][langKey] || responseTemplates[ResponseType.GENERAL][langKey];
  
  // Substitute business data into template
  if (businessData) {
    template = template
      .replace('{business_name}', businessData.name || 'העסק שלנו')
      .replace('{business_hours}', businessData.hours || 'ראשון-חמישי: 9:00-20:00\nשישי: 9:00-14:00\nשבת: סגור')
      .replace('{business_services}', businessData.description || 'שירותי תספורת, צביעה, טיפולי פנים ומניקור');
  } else {
    // Default substitutions if no business data provided
    template = template
      .replace('{business_name}', 'העסק שלנו')
      .replace('{business_hours}', 'ראשון-חמישי: 9:00-20:00\nשישי: 9:00-14:00\nשבת: סגור')
      .replace('{business_services}', 'שירותי תספורת, צביעה, טיפולי פנים ומניקור');
  }
  
  return { content: template };
}

/**
 * Validate and sanitize the response from OpenAI
 * @param response The generated response
 * @param userMessage Original user message
 * @param language Detected language
 * @param businessData Business data for fallback
 * @returns Validated and sanitized response
 */
function validateAndSanitizeResponse(
  response: string, 
  userMessage: string, 
  language: 'he' | 'en',
  businessData?: any
): string {
  // Check if response is empty or too short
  if (!response || response.length < 10) {
    return getControlledResponse(userMessage, '', language, businessData).content;
  }
  
  // Remove any potentially problematic content
  let sanitized = response
    .replace(/http[s]?:\/\/\S+/g, '[link removed]') // Remove URLs
    .replace(/\+\d+/g, '[phone number]') // Mask phone numbers
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[email removed]'); // Remove emails
  
  // Ensure response isn't too long
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + '...';
  }
  
  return sanitized;
}

/**
 * Extract appointment details from a message
 * @param message User message
 * @returns Extracted appointment details or null if not found
 */
export function extractAppointmentDetails(message: string): { name?: string; phone?: string; time?: string } | null {
  const nameMatch = message.match(/שם[י]?[:]?\s*([א-ת\s]+)/i) || 
                    message.match(/name[:]?\s*([A-Za-z\s]+)/i);
  
  const phoneMatch = message.match(/טלפון[:]?\s*([\d\-\+]+)/i) || 
                     message.match(/phone[:]?\s*([\d\-\+]+)/i);
  
  const timeMatch = message.match(/שעה[:]?\s*([^\n,\.]+)/i) || 
                    message.match(/זמן[:]?\s*([^\n,\.]+)/i) ||
                    message.match(/time[:]?\s*([^\n,\.]+)/i);
  
  if (nameMatch || phoneMatch || timeMatch) {
    return {
      name: nameMatch ? nameMatch[1].trim() : undefined,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined,
      time: timeMatch ? timeMatch[1].trim() : undefined
    };
  }
  
  return null;
}

/**
 * Generate a response using the OpenAI API
 * @param userMessage User's message
 * @param systemPrompt System prompt
 * @param apiKey OpenAI API key
 * @returns Response from OpenAI or a controlled response
 */
export async function generateResponse(
  userMessage: string,
  systemPrompt: string,
  apiKey?: string,
  businessData?: any
): Promise<{ content: string }> {
  console.log(`Generating response for message: ${userMessage}`);
  
  // Detect language (simple heuristic)
  const language = detectLanguage(userMessage);
  
  // If no API key is provided, use controlled responses
  if (!apiKey) {
    console.log('No API key provided, using controlled responses');
    return getControlledResponse(userMessage, systemPrompt, language, businessData);
  }
  
  try {
    const response = await getOpenAIResponse(apiKey, systemPrompt, userMessage, businessData);
    return { content: response.content };
  } catch (error) {
    console.error('Error generating response:', error);
    return getControlledResponse(userMessage, systemPrompt, language, businessData);
  }
}

/**
 * Generate a chat response using OpenAI's API
 * @param message User message
 * @param userId User ID (typically phone number)
 * @param systemPrompt System prompt template
 * @param apiKey OpenAI API key (optional, uses env var if not provided)
 * @returns Generated response
 */
export async function generateChatResponse(
  message: string, 
  userId: string, 
  systemPrompt: string,
  apiKey?: string
): Promise<string> {
  try {
    console.log(`Generating response for user ${userId} with message: ${message}`);
    
    // Use provided API key or fall back to environment variable
    const key = apiKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!key) {
      console.error('No OpenAI API key provided');
      return 'Sorry, I cannot generate a response at this time. Please try again later.';
    }
    
    // Initialize OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: key,
    });
    
    // Import the getConversationHistory function from whatsappService
    const { getConversationHistory, addMessageToSession } = require('./whatsappService');
    
    // Get conversation history for this user
    const conversationHistory = getConversationHistory(userId) || [];
    
    console.log(`Retrieved ${conversationHistory.length} previous messages for user ${userId}`);
    
    // Prepare messages array with conversation history
    let messages = [];
    
    // Only include system prompt if it's not empty
    if (systemPrompt.trim() !== '') {
      messages.push({ role: 'system', content: systemPrompt });
      console.log('Including system prompt in the request');
    } else {
      console.log('No system prompt - direct pass-through to ChatGPT API');
    }
    
    // Add conversation history
    messages = [...messages, ...conversationHistory];
    
    // Add the current user message if it's not already in the history
    // This can happen if the message was just added to the session
    const lastMessage = conversationHistory.length > 0 ? 
      conversationHistory[conversationHistory.length - 1] : null;
    
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== message) {
      messages.push({ role: 'user', content: message });
      
      // Also add it to the session for future conversations
      addMessageToSession(userId, message, 'user');
    }
    
    console.log(`Sending ${messages.length} messages to OpenAI (including system prompt)`);
    
    // Generate the response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any, // Type assertion to satisfy TypeScript
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    // Extract the response content
    const responseContent = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    console.log(`Generated response: ${responseContent.substring(0, 100)}${responseContent.length > 100 ? '...' : ''}`);
    
    // Store the assistant's response in the session
    addMessageToSession(userId, responseContent, 'assistant');
    
    return responseContent;
  } catch (error) {
    console.error('Error generating chat response:', error);
    return 'I apologize, but I encountered an error. Please try again later.';
  }
}

/**
 * Detect the language of a message
 * @param message The message to detect language for
 * @returns 'he' for Hebrew, 'en' for English
 */
function detectLanguage(message: string): 'he' | 'en' {
  // Simple language detection heuristic
  return /[\u0590-\u05FF]/.test(message) ? 'he' : 'en';
}
