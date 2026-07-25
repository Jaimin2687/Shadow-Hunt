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

      // Block events from actioned users (ISOLATE / REVOKE_SESSION)
      if (riskAccumulator.isUserBlocked(event.actor.user_id)) {
        const userState = riskAccumulator.getUser(event.actor.user_id)!;
        const reason = userState.is_isolated ? 'ISOLATED' : 'SESSION_REVOKED';
        
        logger.info(`Event BLOCKED from ${reason} user`, { context: { user_id: event.actor.user_id }});
        
        // Broadcast a blocked notification to the dashboard
        broadcaster.broadcast({
          type: 'event_blocked',
          payload: {
            user_id: event.actor.user_id,
            username: userState.username,
            reason,
            original_event_type: event.event_type,
            blocked_at: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

        const latencyMs = (performance.now() - startMs).toFixed(1);
        res.status(200).json({ 
          processed: false, 
          blocked: true, 
          reason,
          latency_ms: parseFloat(latencyMs)
        });
        return;
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
