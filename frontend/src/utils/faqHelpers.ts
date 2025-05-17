/**
 * Utility functions for handling FAQ items in different formats
 */
import { FaqItem } from '../types';

/**
 * Safely renders an FAQ item regardless of its format
 * @param item The FAQ item which can be a string, object, or null
 * @returns An object with question and answer properties
 */
export const safeFaqItem = (item: any): { question: string, answer: string } | null => {
  // Handle null, undefined or empty values
  if (!item) {
    return null;
  }
  
  try {
    // Case 1: Item is an object with question and answer properties
    if (typeof item === 'object') {
      // Check if it has a question property
      if ('question' in item && item.question) {
        return {
          question: String(item.question).trim(),
          answer: item.answer ? String(item.answer).trim() : 'אין תשובה זמינה'
        };
      }
      
      // Check if it has a q/a format
      if ('q' in item && item.q) {
        return {
          question: String(item.q).trim(),
          answer: item.a ? String(item.a).trim() : 'אין תשובה זמינה'
        };
      }
      
      // Check for title/content format
      if ('title' in item && item.title) {
        return {
          question: String(item.title).trim(),
          answer: item.content ? String(item.content).trim() : 'אין תשובה זמינה'
        };
      }
      
      // If we have an array with two items, assume first is question, second is answer
      if (Array.isArray(item) && item.length >= 1) {
        return {
          question: String(item[0]).trim(),
          answer: item[1] ? String(item[1]).trim() : 'אין תשובה זמינה'
        };
      }
    }
    
    // Case 2: Item is a string
    if (typeof item === 'string' && item.trim()) {
      // Check if the string contains a separator like ':' or '?'
      const questionSeparators = ['?', ':', '|', '-', '='];
      for (const separator of questionSeparators) {
        if (item.includes(separator)) {
          const [question, ...answerParts] = item.split(separator);
          if (question.trim()) {
            return {
              question: question.trim(),
              answer: answerParts.join(separator).trim() || 'אין תשובה זמינה'
            };
          }
        }
      }
      
      // If no separator found, use the whole string as a question
      return {
        question: item.trim(),
        answer: 'אין תשובה זמינה'
      };
    }
  } catch (error) {
    console.error('Error processing FAQ item:', error, item);
  }
  
  // Case 3: Invalid item or error occurred
  return null;
};

/**
 * Safely gets FAQ items from a business
 * @param faq The faq property from a business object
 * @returns An array of valid FAQ items
 */
export const getValidFaqItems = (faq: any): Array<{ question: string, answer: string }> => {
  // If faq is not valid, return empty array
  if (!faq) {
    return [];
  }
  
  try {
    // If faq is a string, try to parse it as JSON
    if (typeof faq === 'string') {
      try {
        const parsedFaq = JSON.parse(faq);
        if (Array.isArray(parsedFaq)) {
          return parsedFaq.map(safeFaqItem).filter(Boolean) as Array<{ question: string, answer: string }>;
        }
      } catch (e) {
        // If parsing fails, treat it as a single FAQ item
        const singleItem = safeFaqItem(faq);
        return singleItem ? [singleItem] : [];
      }
    }
    
    // If faq is an array, process each item
    if (Array.isArray(faq)) {
      return faq.map(safeFaqItem).filter(Boolean) as Array<{ question: string, answer: string }>;
    }
    
    // If faq is an object but not an array, check if it's a key-value object where keys are questions and values are answers
    if (typeof faq === 'object' && faq !== null && !Array.isArray(faq)) {
      return Object.entries(faq)
        .map(([key, value]) => ({
          question: key,
          answer: value ? String(value) : 'אין תשובה זמינה'
        }))
        .filter(item => item.question.trim().length > 0);
    }
  } catch (error) {
    console.error('Error processing FAQ items:', error);
    return [];
  }
  
  // Default: return empty array
  return [];
};

/**
 * Format FAQ items for display
 * @param faqItems Array of FAQ items
 * @returns Formatted HTML string
 */
export const formatFaqForDisplay = (faqItems: Array<{ question: string, answer: string }>): string => {
  if (!faqItems || faqItems.length === 0) {
    return '';
  }
  
  return faqItems.map(item => {
    return `<div class="faq-item">
      <div class="faq-question">${item.question}</div>
      <div class="faq-answer">${item.answer}</div>
    </div>`;
  }).join('\n');
};
