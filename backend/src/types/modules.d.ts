// Type declarations for our custom modules

declare module '../services/storageService' {
  export interface FileMetadata {
    name: string;
    path: string;
    contentType: string;
    size: number;
    updated: Date;
    url: string;
  }

  export function uploadFileToStorage(
    sourcePath: string,
    targetPath: string,
    contentType: string
  ): Promise<string>;

  export function getFileFromStorage(filePath: string): Promise<string | null>;

  export function getFileContent(filePath: string): Promise<{ 
    buffer: Buffer; 
    contentType: string 
  } | null>;

  export function deleteFileFromStorage(filePath: string): Promise<boolean>;

  export function listFilesInStorage(folderPath: string): Promise<FileMetadata[]>;
}

declare module '../services/botKnowledgeService' {
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

  export function getBotKnowledgeByBusinessId(businessId: string): Promise<BotKnowledge[]>;
  export function getBotKnowledgeById(id: string): Promise<BotKnowledge | null>;
  export function addBotKnowledge(knowledgeData: Partial<BotKnowledge>): Promise<BotKnowledge>;
  export function updateBotKnowledge(id: string, knowledgeData: Partial<BotKnowledge>): Promise<BotKnowledge | null>;
  export function deleteBotKnowledge(id: string): Promise<boolean>;
}
