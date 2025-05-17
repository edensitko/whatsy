import { getOpenAIApiKey } from '../services/apiKeyService';

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

interface OpenAIRequestOptions {
  prompt: string;
  businessInfo?: {
    name?: string;
    description?: string;
    hours?: string;
    faq?: string[];
    prompt_template?: string;
    additional_data?: any;
  };
}

// We'll use the API key from the environment variable or a default one
// Using import.meta.env for Vite compatibility instead of process.env

export async function getOpenAIResponse(
  options: OpenAIRequestOptions | string,
  userMessage?: string
): Promise<string> {
  try {
    // Get the API key from the backend
    const apiKey = await getOpenAIApiKey();
    
    let systemPrompt: string;
    let userPrompt: string;
    
    // Handle both the new interface and the old one for backward compatibility
    if (typeof options === 'string' && userMessage) {
      // Old interface: (systemPrompt, userMessage)
      systemPrompt = options;
      userPrompt = userMessage;
    } else if (typeof options === 'object') {
      // New interface: ({ prompt, businessInfo })
      const { prompt, businessInfo } = options as OpenAIRequestOptions;
      
      // Create a system prompt that includes business info if provided
      if (businessInfo) {
        // Extract basic info
        const { name, description, hours, faq, prompt_template, additional_data } = businessInfo;
        
        // Create a full JSON representation of all business data
        const businessDataJson = JSON.stringify(businessInfo, null, 2);
        
        // Create a comprehensive system prompt with all business data
        systemPrompt = "אתה עוזר וירטואלי עבור בוט עסקי בווטסאפ. תפקידך לענות לשאלות לקוחות בעברית בצורה מנומסת וקצרה.\n\n" +
          "להלן מידע מלא על העסק בפורמט JSON:\n" +
          "```json\n" + businessDataJson + "\n```\n\n" +
          "שם העסק: " + (name || '') + "\n" +
          "תיאור: " + (description || '') + "\n" +
          (hours ? "שעות פעילות:\n" + hours + "\n" : "") +
          (faq && faq.length > 0 ? "שאלות נפוצות:\n" + faq.map((q, i) => `${i+1}. ${q}`).join("\n") + "\n" : "") +
          (additional_data ? "מידע נוסף על העסק:\n" + JSON.stringify(additional_data, null, 2) + "\n" : "") +
          (prompt_template ? "הנחיות מיוחדות:\n" + prompt_template + "\n" : "") +
          "\nהשתמש בכל המידע לעיל כדי לספק תשובות מדויקות ומועילות לשאלות הלקוחות. " +
          "אל תמציא מידע שלא סופק לך. אם אינך יודע את התשובה, אמור זאת בפשטות.";
      } else {
        systemPrompt = "אתה עוזר וירטואלי שעוזר ליצור בסיסי ידע עבור בוטים עסקיים. ענה בעברית בצורה מנומסת וקצרה.";
      }
      
      userPrompt = prompt;
    } else {
      throw new Error("Invalid arguments to getOpenAIResponse");
    }
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using a more advanced model for better Hebrew responses
        messages,
        temperature: 0.7,
        max_tokens: 500 // Limit token usage for cost control
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
