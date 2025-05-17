import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { 
  uploadFileToStorage,
  getFileFromStorage,
  getFileContent,
  deleteFileFromStorage,
  listFilesInStorage,
  FileMetadata
} from '../services/storageService';
import { authMiddleware } from '../services/authService';

// Define interface for request with user property
interface AuthRequest extends Request {
  user: {
    uid: string;
    [key: string]: any;
  };
  file?: Express.Multer.File;
}

const router = express.Router();

// Use authentication middleware for all storage routes
router.use(authMiddleware);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload file to local storage
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const folder = req.body.folder || 'general';
    const customFilename = req.body.filename || req.file.originalname;
    
    // Upload to local storage
    const fileUrl = await uploadFileToStorage(
      req.file.path, 
      `${folder}/${uid}/${customFilename}`,
      req.file.mimetype
    );
    
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    
    return res.status(200).json({ 
      url: fileUrl,
      filename: customFilename,
      path: `${folder}/${uid}/${customFilename}`
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file: ' + (error.message || 'Unknown error') });
  }
});

// Serve file directly from local storage
router.get('/file/:folder/:uid/:filename', async (req: Request, res: Response) => {
  try {
    const { folder, uid, filename } = req.params;
    const filePath = `${folder}/${uid}/${filename}`;
    
    const fileContent = await getFileContent(filePath);
    
    if (!fileContent) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set content type header
    res.setHeader('Content-Type', fileContent.contentType);
    
    // Send the file content
    return res.send(fileContent.buffer);
  } catch (error: any) {
    console.error('Error serving file:', error);
    return res.status(500).json({ error: 'Failed to serve file: ' + (error.message || 'Unknown error') });
  }
});

// Get file info
router.get('/info/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const { folder, filename } = req.params;
    const filePath = `${folder}/${uid}/${filename}`;
    
    const fileUrl = await getFileFromStorage(filePath);
    
    if (!fileUrl) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    return res.status(200).json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error getting file info:', error);
    return res.status(500).json({ error: 'Failed to get file info: ' + (error.message || 'Unknown error') });
  }
});

// List files in a folder
router.get('/list/:folder', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const { folder } = req.params;
    const folderPath = `${folder}/${uid}`;
    
    const files = await listFilesInStorage(folderPath);
    
    return res.status(200).json({ files });
  } catch (error: any) {
    console.error('Error listing files:', error);
    return res.status(500).json({ error: 'Failed to list files: ' + (error.message || 'Unknown error') });
  }
});

// Delete file from local storage
router.delete('/file/:folder/:filename', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { uid } = authReq.user;
    const { folder, filename } = req.params;
    const filePath = `${folder}/${uid}/${filename}`;
    
    const success = await deleteFileFromStorage(filePath);
    
    if (!success) {
      return res.status(404).json({ error: 'File not found or could not be deleted' });
    }
    
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file: ' + (error.message || 'Unknown error') });
  }
});

export { router as storageRouter };
