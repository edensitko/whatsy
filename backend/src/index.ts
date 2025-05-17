import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { whatsappRouter } from './routes/whatsapp';
import { businessRouter } from './routes/business';
import simpleAuthRouter from './routes/simpleAuth';
import { storageRouter } from './routes/storage';
import { botKnowledgeRouter } from './routes/botKnowledge';
import { appointmentsRouter } from './routes/appointments';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Enhanced CORS configuration to allow access from any origin
app.use(cors({
  origin: true, // Allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'], // Allow all HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'], // Allow common headers
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true, // Allow sending credentials
  maxAge: 86400, // Cache preflight results for 24 hours
  preflightContinue: false
}));

// Special handling for OPTIONS requests (preflight)
app.options('*', cors());

// Add response headers to all requests to ensure CORS works properly
app.use((req, res, next) => {
  // Instead of using a wildcard, reflect the request origin
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '10mb' })); // הגדל את הגבול לקבלת JSON גדולים יותר
// Ensure proper parsing of form-encoded data that Twilio sends
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/business', businessRouter);
app.use('/api/webhook/twilio', whatsappRouter);

// Use simple auth router for development
app.use('/api/auth', simpleAuthRouter);

// Add new routes for storage and bot knowledge
app.use('/api/storage', storageRouter);
app.use('/api/bot-knowledge', botKnowledgeRouter);
app.use('/api/appointments', appointmentsRouter);

// Add the logs endpoint at the root level
app.get('/api/logs/latest', (req, res) => {
  const latestMockMessage = (whatsappRouter as any).latestMockMessage || '';
  res.status(200).json({ mockMessage: latestMockMessage });
});

// Health check endpoints (both at root level and under /api for Docker health checks)
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

app.get('/api/health', (req, res) => {
  res.status(200).send('Server is running');
});

// SSL/TLS Certificate paths
const sslEnabled = process.env.ENABLE_HTTPS === 'true';
const certPath = process.env.SSL_CERT_PATH || './certs/cert.pem';
const keyPath = process.env.SSL_KEY_PATH || './certs/key.pem';

// Create HTTP server
const httpServer = http.createServer(app);

// Start HTTP server
httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`WhatsApp webhook URL (HTTP): http://localhost:${PORT}/api/webhook/twilio`);
});

// Create and start HTTPS server if SSL is enabled
if (sslEnabled) {
  try {
    // Check if certificate files exist
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn(`SSL certificate files not found at ${certPath} and ${keyPath}`);
      console.warn('HTTPS server will not start. Create certificates or set correct paths in environment variables.');
    } else {
      // SSL certificate options
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };

      // Create HTTPS server
      const httpsServer = https.createServer(httpsOptions, app);
      const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '443');

      // Start HTTPS server
      httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
        console.log(`WhatsApp webhook URL (HTTPS): https://localhost:${HTTPS_PORT}/api/webhook/twilio`);
        console.log('Configure this HTTPS URL in Twilio for secure webhook communication');
      });
    }
  } catch (error) {
    console.error('Error starting HTTPS server:', error);
    console.warn('HTTPS server failed to start. Using HTTP server only.');
  }
}

console.log('Make sure to expose these URLs and configure them in Twilio');
console.log(`OpenAI API Key is configured and ready for WhatsApp bot integration`);
