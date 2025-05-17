import express from 'express';
import { 
  getBusinessById, 
  getBusinessByPhoneNumber, 
  updateBusiness, 
  createBusiness,
  getAllBusinesses,
  deleteBusiness,
  getBusinessesByOwnerId
} from '../services/businessService';
import { optionalAuthMiddleware } from '../services/authService';
import { generateChatResponse } from '../services/openaiService';

const router = express.Router();

// Use the built-in optional auth middleware instead of creating our own
router.use(optionalAuthMiddleware);

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await getAllBusinesses();
    return res.status(200).json(businesses);
  } catch (error) {
    console.error('Error getting businesses:', error);
    return res.status(500).send('Error getting businesses');
  }
});

// Get businesses owned by the current user
router.get('/my-businesses', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const businesses = await getBusinessesByOwnerId(user.uid);
    return res.status(200).json(businesses);
  } catch (error) {
    console.error('Error getting user businesses:', error);
    return res.status(500).send('Error getting user businesses');
  }
});

// Get business by ID
router.get('/:id', async (req, res) => {
  try {
    const business = await getBusinessById(req.params.id);
    
    if (!business) {
      return res.status(404).send('Business not found');
    }
    
    // The business service now handles conversion to frontend format
    return res.status(200).json(business);
  } catch (error) {
    console.error('Error getting business:', error);
    return res.status(500).send('Error getting business');
  }
});

// Get business by phone number
router.get('/phone/:phoneNumber', async (req, res) => {
  try {
    const business = await getBusinessByPhoneNumber(req.params.phoneNumber);
    
    if (!business) {
      return res.status(404).send('Business not found');
    }
    
    return res.status(200).json(business);
  } catch (error) {
    console.error('Error getting business:', error);
    return res.status(500).send('Error getting business');
  }
});

// Create new business
router.post('/', async (req, res) => {
  try {
    const businessData = req.body;
    
    // Check for required fields in either format
    if (!businessData.name || (!businessData.whatsapp_number && !businessData.phone_number)) {
      return res.status(400).send('Missing required fields: name and phone number');
    }
    
    // Add owner_id from authenticated user
    const user = (req as any).user;
    if (user && user.uid) {
      businessData.owner_id = user.uid;
      console.log(`Creating business for user: ${user.uid}`);
    } else {
      console.log('No authenticated user found, creating business without owner');
    }
    
    const newBusiness = await createBusiness(businessData);
    return res.status(201).json(newBusiness);
  } catch (error) {
    console.error('Error creating business:', error);
    return res.status(500).send('Error creating business');
  }
});

// Update business
router.put('/:id', async (req, res) => {
  try {
    console.log(`Updating business with ID: ${req.params.id}`);
    console.log('Update payload:', JSON.stringify(req.body, null, 2));
    
    const businessData = req.body;
    
    // Check if the user is authorized to update this business
    const user = (req as any).user;
    const existingBusiness = await getBusinessById(req.params.id);
    
    if (existingBusiness && existingBusiness.owner_id && user && user.uid) {
      if (existingBusiness.owner_id !== user.uid) {
        return res.status(403).json({ error: 'You are not authorized to update this business' });
      }
    }
    
    const updatedBusiness = await updateBusiness(req.params.id, businessData);
    
    if (!updatedBusiness) {
      console.log(`Business with ID ${req.params.id} not found`);
      return res.status(404).send('Business not found');
    }
    
    console.log(`Business updated successfully: ${updatedBusiness.name}`);
    return res.status(200).json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    return res.status(500).send('Error updating business');
  }
});

// Delete business
router.delete('/:id', async (req, res) => {
  try {
    // Check if the user is authorized to delete this business
    const user = (req as any).user;
    const existingBusiness = await getBusinessById(req.params.id);
    
    if (existingBusiness && existingBusiness.owner_id && user && user.uid) {
      if (existingBusiness.owner_id !== user.uid) {
        return res.status(403).json({ error: 'You are not authorized to delete this business' });
      }
    }
    
    const success = await deleteBusiness(req.params.id);
    
    if (!success) {
      return res.status(404).send('Business not found');
    }
    
    return res.status(200).json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return res.status(500).send('Error deleting business');
  }
});

// Get OpenAI API key
router.get('/api-key/openai', (req, res) => {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // For security, only return a masked version of the key to the frontend
    const maskedKey = maskApiKey(apiKey);
    
    return res.status(200).json({ 
      apiKey: apiKey,
      maskedKey: maskedKey
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return res.status(500).json({ error: 'Error getting API key' });
  }
});

// Helper function to mask API key for display
function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  // Show only the first 4 and last 4 characters
  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  const maskedPortion = '*'.repeat(Math.max(0, apiKey.length - 8));
  
  return `${prefix}${maskedPortion}${suffix}`;
}

// New endpoint to generate ChatGPT responses using the business's prompt template
router.post('/:id/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const businessId = req.params.id;
    
    // Validate input
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get the business
    const business = await getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Get the prompt template from the business
    let promptTemplate = business.prompt_template || 'You are an assistant for {business_name}. Please help the customer with their inquiry.';
    
    // Replace template variables with business data
    promptTemplate = promptTemplate
      .replace('{business_name}', business.name)
      .replace('{description}', business.description || '')
      .replace('{phone_number}', business.phone_number || business.whatsapp_number || '');
      
    // Format business hours if available
    if (business.hours) {
      const hoursText = Object.entries(business.hours)
        .filter(([_, value]) => value) // Filter out empty hours
        .map(([day, hours]) => `${day}: ${hours}`)
        .join(', ');
      
      promptTemplate = promptTemplate.replace('{hours}', hoursText);
    }
    
    // Add FAQ information if available
    if (business.faq && business.faq.length > 0) {
      const faqText = business.faq
        .map(item => `Q: ${item.question}\nA: ${item.answer}`)
        .join('\n\n');
      
      promptTemplate += `\n\nFrequently Asked Questions:\n${faqText}`;
    }
    
    // Generate a unique user ID for this conversation
    // In a real app, you'd want to track conversations by user
    const userId = req.body.userId || `user-${Date.now()}`;
    
    // Use the business's API key if available, otherwise use the default one
    const apiKey = business.openai_api_key || process.env.OPENAI_API_KEY;
    
    // Generate the response
    const response = await generateChatResponse(
      message,
      userId,
      promptTemplate,
      apiKey
    );
    
    return res.status(200).json({ 
      response,
      business_id: businessId,
      business_name: business.name
    });
  } catch (error) {
    console.error('Error generating chat response:', error);
    return res.status(500).json({ error: 'Error generating response' });
  }
});

export { router as businessRouter };
