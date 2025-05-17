// This service handles retrieving and managing API keys for external services

/**
 * Retrieves the OpenAI API key from the backend or local storage
 * @returns Promise<string> The API key
 */
export async function getOpenAIApiKey(): Promise<string> {
  try {
    // First try to get the API key from the backend
    const response = await fetch('/api/config/openai-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      return data.apiKey;
    }

    // If backend request fails, check local storage
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      return storedKey;
    }

    // If no key is found, use the environment variable (if available)
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      return import.meta.env.VITE_OPENAI_API_KEY;
    }

    // If all else fails, throw an error
    throw new Error('No OpenAI API key found');
  } catch (error) {
    console.error('Error retrieving OpenAI API key:', error);
    throw error;
  }
}

/**
 * Saves the OpenAI API key to local storage
 * @param apiKey The API key to save
 */
export function saveOpenAIApiKey(apiKey: string): void {
  localStorage.setItem('openai_api_key', apiKey);
}

/**
 * Clears the stored OpenAI API key from local storage
 */
export function clearOpenAIApiKey(): void {
  localStorage.removeItem('openai_api_key');
}
