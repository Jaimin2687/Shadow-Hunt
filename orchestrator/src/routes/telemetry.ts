import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TelemetryEvent } from '../types/events.js';
import { EngineClient } from '../services/engineClient.js';
import { RiskAccumulator } from '../services/riskAccumulator.js';
import { WSBroadcaster } from '../ws/broadcaster.js';
import { logger } from '../utils/logger.js';

export function createTelemetryRouter(
  engineClient: EngineClient,
  riskAccumulator: RiskAccumulator,
  broadcaster: WSBroadcaster
) {
  const router = Router();

  const telemetrySchema = z.object({
    event_id: z.string().regex(/^[a-zA-Z0-9._-]+$/),
    actor: z.object({
      user_id: z.string().regex(/^[a-zA-Z0-9._-]+$/),
      username: z.string().regex(/^[a-zA-Z0-9._-]+$/)
    }).passthrough()
  }).passthrough(); // allows other fields since we only care about sanitizing specific ones here

  router.post('/', async (req: Request, res: Response) => {
    const startMs = performance.now();
    try {
      // Validate required nested fields
      if (!req.body?.actor?.user_id || !req.body?.timestamp || !req.body?.target?.resource_id) {
        res.status(400).json({ 
          error: 'Invalid event: requires actor.user_id, timestamp, target.resource_id' 
        });
        return;
      }

      const parsed = telemetrySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed: Invalid characters in identifier fields' });
        return;
      }

      const event = req.body as TelemetryEvent;

      // Check if user is isolated (SOAR response)
      const existingState = riskAccumulator.getUser(event.actor.user_id);
      if (existingState?.is_isolated) {
        // Still process for tracking, but flag it
        logger.warn('Event from ISOLATED user', { context: { user_id: event.actor.user_id }});
      }

      const anomalyResponse = await engineClient.scoreEvent(event);
      const { userState, newAlerts } = riskAccumulator.updateRisk(event, anomalyResponse);

      broadcaster.broadcastEvent(event, userState);
      broadcaster.broadcastRiskUpdate(userState);

      for (const alert of newAlerts) {
        broadcaster.broadcastAlert(alert);
      }

      const latencyMs = (performance.now() - startMs).toFixed(1);
      res.status(200).json({ 
        processed: true, 
        risk_score: userState.current_risk,
        severity: anomalyResponse.severity,
        latency_ms: parseFloat(latencyMs)
      });
    } catch (error: any) {
      const latencyMs = performance.now() - startMs;
      logger.error(`Error processing telemetry (${latencyMs.toFixed(1)}ms)`, { context: { error: error?.message || error }});
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
