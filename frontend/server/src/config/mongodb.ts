import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class MongoDBClient {
  private isConnected: boolean = false;

  constructor() {
    // Set mongoose options
    mongoose.set('strictQuery', false);
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Already connected to MongoDB');
      return;
    }

    try {
      await mongoose.connect(env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      });

      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Check if MongoDB is connected
   */
  isReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get MongoDB connection
   */
  getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }
}

export const mongoClient = new MongoDBClient();
