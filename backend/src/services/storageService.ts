import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Define the base directory for file storage
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// File metadata interface
export interface FileMetadata {
  name: string;
  path: string;
  contentType: string;
  size: number;
  updated: Date;
  url: string;
}

/**
 * Get the full server path for a file
 * @param relativePath Relative path within the uploads directory
 * @returns Full path to the file on the server
 */
export const getFullPath = (relativePath: string): string => {
  // Normalize the path to prevent directory traversal attacks
  const normalizedPath = path.normalize(relativePath).replace(/^\//, '');
  return path.join(UPLOADS_DIR, normalizedPath);
};

/**
 * Get the public URL for a file
 * @param relativePath Relative path within the uploads directory
 * @returns Public URL for the file
 */
export const getPublicUrl = (relativePath: string): string => {
  // Convert backslashes to forward slashes for URLs
  const urlPath = relativePath.replace(/\\/g, '/');
  return `/api/storage/file/${urlPath}`;
};

/**
 * Upload a file to the server
 * @param sourcePath Local path to the source file
 * @param targetPath Target path within the uploads directory
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export const uploadFileToStorage = async (
  sourcePath: string,
  targetPath: string,
  contentType: string
): Promise<string> => {
  try {
    // Create directory if it doesn't exist
    const targetDir = path.dirname(getFullPath(targetPath));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Read the source file
    const fileBuffer = fs.readFileSync(sourcePath);
    
    // Write to the target location
    const fullPath = getFullPath(targetPath);
    fs.writeFileSync(fullPath, fileBuffer);
    
    // Store metadata
    const metadata = {
      contentType,
      size: fileBuffer.length,
      updated: new Date()
    };
    
    // Write metadata to a JSON file
    const metadataPath = `${fullPath}.meta.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Return the public URL
    return getPublicUrl(targetPath);
  } catch (error) {
    console.error('Error uploading file to server:', error);
    throw error;
  }
};

/**
 * Get a file from the server
 * @param filePath Path to the file within the uploads directory
 * @returns Public URL of the file or null if not found
 */
export const getFileFromStorage = async (filePath: string): Promise<string | null> => {
  try {
    const fullPath = getFullPath(filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    // Return the public URL
    return getPublicUrl(filePath);
  } catch (error) {
    console.error('Error getting file from server:', error);
    throw error;
  }
};

/**
 * Get the file content from the server
 * @param filePath Path to the file within the uploads directory
 * @returns File buffer and metadata or null if not found
 */
export const getFileContent = async (filePath: string): Promise<{ buffer: Buffer; contentType: string } | null> => {
  try {
    const fullPath = getFullPath(filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    // Read the file
    const buffer = fs.readFileSync(fullPath);
    
    // Read metadata if available
    let contentType = 'application/octet-stream';
    const metadataPath = `${fullPath}.meta.json`;
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      contentType = metadata.contentType || contentType;
    }
    
    return { buffer, contentType };
  } catch (error) {
    console.error('Error getting file content from server:', error);
    throw error;
  }
};

/**
 * Delete a file from the server
 * @param filePath Path to the file within the uploads directory
 * @returns Boolean indicating success
 */
export const deleteFileFromStorage = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = getFullPath(filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return false;
    }
    
    // Delete the file
    fs.unlinkSync(fullPath);
    
    // Delete metadata if it exists
    const metadataPath = `${fullPath}.meta.json`;
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file from server:', error);
    throw error;
  }
};

/**
 * List all files in a folder on the server
 * @param folderPath Path to the folder within the uploads directory
 * @returns Array of file metadata
 */
export const listFilesInStorage = async (folderPath: string): Promise<FileMetadata[]> => {
  try {
    const fullPath = getFullPath(folderPath);
    
    // Check if directory exists
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    
    // Get all files in the directory (non-recursive)
    const files = fs.readdirSync(fullPath)
      .filter(file => !file.endsWith('.meta.json')) // Filter out metadata files
      .filter(file => fs.statSync(path.join(fullPath, file)).isFile()); // Only include files, not directories
    
    // Get metadata for each file
    const fileDetails = files.map(file => {
      const filePath = path.join(folderPath, file);
      const fullFilePath = getFullPath(filePath);
      const stats = fs.statSync(fullFilePath);
      
      // Get metadata if available
      let contentType = 'application/octet-stream';
      let metadata: any = {};
      const metadataPath = `${fullFilePath}.meta.json`;
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        contentType = metadata.contentType || contentType;
      }
      
      return {
        name: file,
        path: filePath,
        contentType,
        size: stats.size,
        updated: metadata.updated || stats.mtime,
        url: getPublicUrl(filePath)
      };
    });
    
    return fileDetails;
  } catch (error) {
    console.error('Error listing files on server:', error);
    throw error;
  }
};
