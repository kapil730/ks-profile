import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Ensure dotenv is loaded before accessing process.env
dotenv.config();

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI;

  // Validation: Check if MONGODB_URI is undefined, null, or empty string
  if (!mongoURI || mongoURI.trim() === '') {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    console.error('👉 Please configure MONGODB_URI in your server/.env file or deployment dashboard.');
    console.warn('ℹ️  The backend will serve memory fallback data for public routes until MONGODB_URI is configured.');
    isConnected = false;
    return false;
  }

  try {
    // Mask sensitive credentials in logs if present
    const maskedURI = mongoURI.replace(/\/\/(.*?)@/, '//***:***@');
    console.log(`⏳ Connecting to MongoDB (${maskedURI})...`);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}:${conn.connection.port || 27017}/${conn.connection.name}`);

    // Register runtime connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Runtime Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB connection lost / disconnected.');
      isConnected = false;
    });

    return true;
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('ℹ️  The backend will serve memory fallback data for public routes so the server remains online.');
    isConnected = false;
    return false;
  }
};

export const getIsConnected = (): boolean => isConnected;

