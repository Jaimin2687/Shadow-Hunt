import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const API_KEY = process.env.API_KEY || 'shadow-hunt-default-key';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Allow health check without auth
  if (req.path === '/api/health') return next();
  
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key || key !== API_KEY) {
    logger.warn('Authentication failed', { 
      context: { 
        endpoint: req.originalUrl, 
        provided_key: key || 'none', 
        ip: req.ip 
      } 
    });
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }
  
  logger.info('Authentication successful', {
    context: {
      endpoint: req.originalUrl,
      provided_key: key,
      ip: req.ip
    }
  });
  next();
}
