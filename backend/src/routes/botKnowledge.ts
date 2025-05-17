import express, { Request, Response } from 'express';
import { 
  getBotKnowledgeByBusinessId,
  addBotKnowledge,
  updateBotKnowledge,
  deleteBotKnowledge,
  getBotKnowledgeById
} from '../services/botKnowledgeService';
import { authMiddleware } from '../services/authService';
import { getBusinessById } from '../services/businessService';

// Define interface for request with user property
interface AuthRequest extends Request {
  user: {
    uid: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Use authentication middleware for all bot knowledge routes
router.use(authMiddleware);

// Get all bot knowledge for a business
router.get('/business/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    
    // Check if the user is authorized to access this business's knowledge
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const business = await getBusinessById(businessId);
    
    if (business && business.owner_id && uid !== business.owner_id) {
      return res.status(403).json({ error: 'You are not authorized to access this business data' });
    }
    
    const knowledge = await getBotKnowledgeByBusinessId(businessId);
    return res.status(200).json(knowledge);
  } catch (error: any) {
    console.error('Error getting bot knowledge:', error);
    return res.status(500).json({ error: 'Failed to get bot knowledge: ' + (error.message || 'Unknown error') });
  }
});

// Get specific bot knowledge item
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const knowledge = await getBotKnowledgeById(id);
    
    if (!knowledge) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }
    
    // Check if the user is authorized to access this knowledge
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const business = await getBusinessById(knowledge.businessId);
    
    if (business && business.owner_id && uid !== business.owner_id) {
      return res.status(403).json({ error: 'You are not authorized to access this knowledge item' });
    }
    
    return res.status(200).json(knowledge);
  } catch (error: any) {
    console.error('Error getting bot knowledge item:', error);
    return res.status(500).json({ error: 'Failed to get knowledge item: ' + (error.message || 'Unknown error') });
  }
});

// Add new bot knowledge
router.post('/', async (req: Request, res: Response) => {
  try {
    const knowledgeData = req.body;
    
    if (!knowledgeData.businessId || !knowledgeData.content) {
      return res.status(400).json({ error: 'Missing required fields: businessId and content' });
    }
    
    // Check if the user is authorized to add knowledge to this business
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const business = await getBusinessById(knowledgeData.businessId);
    
    if (business && business.owner_id && uid !== business.owner_id) {
      return res.status(403).json({ error: 'You are not authorized to add knowledge to this business' });
    }
    
    // Add the user ID to the knowledge data
    knowledgeData.createdBy = uid;
    
    const newKnowledge = await addBotKnowledge(knowledgeData);
    return res.status(201).json(newKnowledge);
  } catch (error: any) {
    console.error('Error adding bot knowledge:', error);
    return res.status(500).json({ error: 'Failed to add bot knowledge: ' + (error.message || 'Unknown error') });
  }
});

// Update bot knowledge
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const knowledgeData = req.body;
    
    // Check if the knowledge item exists
    const existingKnowledge = await getBotKnowledgeById(id);
    if (!existingKnowledge) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }
    
    // Check if the user is authorized to update this knowledge
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const business = await getBusinessById(existingKnowledge.businessId);
    
    if (business && business.owner_id && uid !== business.owner_id) {
      return res.status(403).json({ error: 'You are not authorized to update this knowledge item' });
    }
    
    // Add updated timestamp
    knowledgeData.updatedAt = new Date();
    
    const updatedKnowledge = await updateBotKnowledge(id, knowledgeData);
    return res.status(200).json(updatedKnowledge);
  } catch (error: any) {
    console.error('Error updating bot knowledge:', error);
    return res.status(500).json({ error: 'Failed to update bot knowledge: ' + (error.message || 'Unknown error') });
  }
});

// Delete bot knowledge
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if the knowledge item exists
    const existingKnowledge = await getBotKnowledgeById(id);
    if (!existingKnowledge) {
      return res.status(404).json({ error: 'Knowledge item not found' });
    }
    
    // Check if the user is authorized to delete this knowledge
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const business = await getBusinessById(existingKnowledge.businessId);
    
    if (business && business.owner_id && uid !== business.owner_id) {
      return res.status(403).json({ error: 'You are not authorized to delete this knowledge item' });
    }
    
    const success = await deleteBotKnowledge(id);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete knowledge item' });
    }
    
    return res.status(200).json({ message: 'Knowledge item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bot knowledge:', error);
    return res.status(500).json({ error: 'Failed to delete bot knowledge: ' + (error.message || 'Unknown error') });
  }
});

export { router as botKnowledgeRouter };
