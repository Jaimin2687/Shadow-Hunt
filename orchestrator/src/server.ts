import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { config } from './config.js';
import { EngineClient } from './services/engineClient.js';
import { RiskAccumulator } from './services/riskAccumulator.js';
import { WSBroadcaster } from './ws/broadcaster.js';
import { SoarDispatcher } from './services/soarDispatcher.js';

import { createTelemetryRouter } from './routes/telemetry.js';
import { createRespondRouter } from './routes/respond.js';
import { getUsersRouter } from './routes/users.js';
import { apiKeyAuth } from './middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';

const telemetryLimiter = rateLimit({
  windowMs: 1000,
  max: 50,
  message: { error: 'Telemetry rate limit exceeded' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { context: { endpoint: req.originalUrl, ip: req.ip } });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false
});

const soarLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: { error: 'SOAR rate limit exceeded' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { context: { endpoint: req.originalUrl, ip: req.ip } });
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Create Express app
const app = express();

// 3. Configure CORS middleware (allow CLIENT_ORIGIN)
app.use(cors({ origin: config.CLIENT_ORIGIN }));

// 4. Configure JSON body parser (limit 1mb)
app.use(express.json({ limit: '1mb' }));

// 5. Create HTTP server from Express app
const server = http.createServer(app);

// 6. Initialize services
const riskAccumulator = new RiskAccumulator();
const broadcaster = new WSBroadcaster(server);
const engineClient = new EngineClient();
const soarDispatcher = new SoarDispatcher(riskAccumulator, broadcaster);

// 7. Mount routes
app.use('/api/telemetry', telemetryLimiter, createTelemetryRouter(engineClient, riskAccumulator, broadcaster));
app.use('/api/respond', soarLimiter, apiKeyAuth, createRespondRouter(soarDispatcher));
app.use('/api/users', apiKeyAuth, getUsersRouter(riskAccumulator));

// 8. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: broadcaster.getClientCount(),
    users: riskAccumulator.getAllUsers().length
  });
});

// 9. Start listening on PORT
server.listen(config.PORT, () => {
  // 10. Log startup message
  logger.info(`Orchestrator listening on port ${config.PORT}`, { context: { port: config.PORT } });
  logger.info(`Connected to Engine URL: ${config.ENGINE_URL}`);
  logger.info(`Allowed Client Origin: ${config.CLIENT_ORIGIN}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
