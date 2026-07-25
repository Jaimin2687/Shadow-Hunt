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
app.use('/api/telemetry', createTelemetryRouter(engineClient, riskAccumulator, broadcaster));
app.use('/api/respond', createRespondRouter(soarDispatcher));
app.use('/api/users', getUsersRouter(riskAccumulator));

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
  console.log(`[Server] Orchestrator listening on port ${config.PORT}`);
  console.log(`[Server] Connected to Engine URL: ${config.ENGINE_URL}`);
  console.log(`[Server] Allowed Client Origin: ${config.CLIENT_ORIGIN}`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
