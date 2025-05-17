import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }

    interface Request {
      user?: {
        uid: string;
        email?: string;
        [key: string]: any;
      };
      file?: Multer.File;
    }
  }
}
