import { adminDb as db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';

// Interface for bot knowledge
export interface BotKnowledge {
  id: string;
  businessId: string;
  content: string;
  title?: string;
  category?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Get all bot knowledge items for a business
 * @param businessId Business ID
 * @returns Array of knowledge items
 */
export const getBotKnowledgeByBusinessId = async (businessId: string): Promise<BotKnowledge[]> => {
  try {
    const knowledgeRef = db.collection('botKnowledge');
    const knowledgeSnapshot = await knowledgeRef
      .where('businessId', '==', businessId)
      .get();
    
    if (knowledgeSnapshot.empty) {
      return [];
    }
    
    return knowledgeSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        businessId: data.businessId,
        content: data.content,
        title: data.title || '',
        category: data.category || 'general',
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
        metadata: data.metadata || {}
      };
    });
  } catch (error) {
    console.error('Error getting bot knowledge:', error);
    throw error;
  }
};

/**
 * Get a specific bot knowledge item by ID
 * @param id Knowledge item ID
 * @returns Knowledge item or null if not found
 */
export const getBotKnowledgeById = async (id: string): Promise<BotKnowledge | null> => {
  try {
    const knowledgeDoc = await db.collection('botKnowledge').doc(id).get();
    
    if (!knowledgeDoc.exists) {
      return null;
    }
    
    const data = knowledgeDoc.data()!;
    return {
      id: knowledgeDoc.id,
      businessId: data.businessId,
      content: data.content,
      title: data.title || '',
      category: data.category || 'general',
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.error('Error getting bot knowledge item:', error);
    throw error;
  }
};

/**
 * Add a new bot knowledge item
 * @param knowledgeData Knowledge item data
 * @returns Created knowledge item
 */
export const addBotKnowledge = async (knowledgeData: Partial<BotKnowledge>): Promise<BotKnowledge> => {
  try {
    const id = knowledgeData.id || uuidv4();
    const now = new Date();
    
    const newKnowledge: BotKnowledge = {
      id,
      businessId: knowledgeData.businessId!,
      content: knowledgeData.content!,
      title: knowledgeData.title || '',
      category: knowledgeData.category || 'general',
      createdBy: knowledgeData.createdBy!,
      createdAt: now,
      updatedAt: now,
      metadata: knowledgeData.metadata || {}
    };
    
    await db.collection('botKnowledge').doc(id).set(newKnowledge);
    
    return newKnowledge;
  } catch (error) {
    console.error('Error adding bot knowledge:', error);
    throw error;
  }
};

/**
 * Update an existing bot knowledge item
 * @param id Knowledge item ID
 * @param knowledgeData Updated knowledge data
 * @returns Updated knowledge item
 */
export const updateBotKnowledge = async (
  id: string,
  knowledgeData: Partial<BotKnowledge>
): Promise<BotKnowledge | null> => {
  try {
    // Check if the knowledge item exists
    const knowledgeDoc = await db.collection('botKnowledge').doc(id).get();
    
    if (!knowledgeDoc.exists) {
      return null;
    }
    
    // Update the knowledge item
    const updatedData = {
      ...knowledgeData,
      updatedAt: new Date()
    };
    
    await db.collection('botKnowledge').doc(id).update(updatedData);
    
    // Get the updated document
    const updatedDoc = await db.collection('botKnowledge').doc(id).get();
    const data = updatedDoc.data()!;
    
    return {
      id: updatedDoc.id,
      businessId: data.businessId,
      content: data.content,
      title: data.title || '',
      category: data.category || 'general',
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.error('Error updating bot knowledge:', error);
    throw error;
  }
};

/**
 * Delete a bot knowledge item
 * @param id Knowledge item ID
 * @returns Boolean indicating success
 */
export const deleteBotKnowledge = async (id: string): Promise<boolean> => {
  try {
    // Check if the knowledge item exists
    const knowledgeDoc = await db.collection('botKnowledge').doc(id).get();
    
    if (!knowledgeDoc.exists) {
      return false;
    }
    
    // Delete the knowledge item
    await db.collection('botKnowledge').doc(id).delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting bot knowledge:', error);
    throw error;
  }
};
