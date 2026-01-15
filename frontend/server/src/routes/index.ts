import { Router } from 'express';
import authRoutes from './auth.routes.js';
import { env } from '../config/env.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API version info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tryinterview Authentication API',
    version: env.API_VERSION,
    documentation: '/api-docs',
  });
});

// Mount auth routes
router.use('/auth', authRoutes);

export default router;
