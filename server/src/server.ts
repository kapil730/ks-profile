import dotenv from 'dotenv';
// Ensure environment variables are loaded before any other modules or database code run
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB, getIsConnected } from './config/db.js';
import projectRoutes from './routes/projectRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

export const app = express();

// Port configuration: parse from process.env.PORT, safely fallback to 5000
const rawPort = process.env.PORT;
export const DEFAULT_PORT = rawPort && !isNaN(parseInt(rawPort, 10)) ? parseInt(rawPort, 10) : 5000;

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL,
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/testing, can be restricted via CLIENT_URL
      }
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiter to /api
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Kapil Shah Portfolio Backend API',
    database: getIsConnected() ? 'connected' : 'fallback-memory',
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/contact', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Server lifecycle management: ensure single listen call and automatic fallback if port is occupied
let serverInstance: http.Server | null = null;
let isStarting = false;

/**
 * Starts the HTTP server, ensuring single initialization and auto-incrementing port fallback on EADDRINUSE.
 */
export const startServer = async (
  port: number = DEFAULT_PORT,
  maxRetries: number = 10
): Promise<http.Server> => {
  // Prevent duplicate execution
  if (serverInstance && serverInstance.listening) {
    console.warn('⚠️ Server is already active and listening. Ignoring duplicate startServer() call.');
    return serverInstance;
  }
  if (isStarting) {
    console.warn('⚠️ Server startup is already in progress.');
    return serverInstance!;
  }

  isStarting = true;

  // Initialize and verify MongoDB connection before accepting HTTP traffic
  await connectDB();

  return new Promise((resolve, reject) => {
    const tryListen = (currentPort: number, retriesLeft: number) => {
      const server = http.createServer(app);

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️ Port ${currentPort} is already in use by another process.`);
          if (retriesLeft > 0) {
            const nextPort = currentPort + 1;
            console.log(`🔄 Automatically attempting to bind to next available port: ${nextPort}...`);
            tryListen(nextPort, retriesLeft - 1);
          } else {
            isStarting = false;
            console.error(`❌ Exhausted port retries starting from port ${port}.`);
            reject(err);
          }
        } else {
          isStarting = false;
          console.error(`❌ Server encountered an error:`, err);
          reject(err);
        }
      });

      server.once('listening', () => {
        serverInstance = server;
        isStarting = false;

        const address = server.address();
        const activePort = typeof address === 'object' && address ? address.port : currentPort;

        console.log(`🚀 Server successfully running on port ${activePort}`);
        console.log(`📍 API endpoints available at http://localhost:${activePort}/api`);

        if (activePort !== port) {
          console.warn(
            `ℹ️ Notice: Configured port ${port} was busy, so port ${activePort} was automatically assigned.`
          );
        }

        resolve(server);
      });

      server.listen(currentPort);
    };

    tryListen(port, maxRetries);
  });
};

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('🔒 HTTP server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Automatically start server unless running in automated test suite
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('❌ Fatal server startup failure:', err);
    process.exit(1);
  });
}

export default app;
