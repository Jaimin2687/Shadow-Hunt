import { Router, Request, Response } from 'express';
import { TelemetryEvent } from '../types/events.js';
import { EngineClient } from '../services/engineClient.js';
import { RiskAccumulator } from '../services/riskAccumulator.js';
import { WSBroadcaster } from '../ws/broadcaster.js';

export function createTelemetryRouter(
  engineClient: EngineClient,
  riskAccumulator: RiskAccumulator,
  broadcaster: WSBroadcaster
) {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const startMs = performance.now();
    try {
      const event = req.body as TelemetryEvent;
      
      // Validate required nested fields
      if (!event?.actor?.user_id || !event?.timestamp || !event?.target?.resource_id) {
        res.status(400).json({ 
          error: 'Invalid event: requires actor.user_id, timestamp, target.resource_id' 
        });
        return;
      }

      // Check if user is isolated (SOAR response)
      const existingState = riskAccumulator.getUser(event.actor.user_id);
      if (existingState?.is_isolated) {
        // Still process for tracking, but flag it
        console.warn(`[Telemetry] Event from ISOLATED user: ${event.actor.user_id}`);
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
      const latencyMs = (performance.now() - startMs).toFixed(1);
      console.error(`[Telemetry] Error (${latencyMs}ms):`, error?.message || error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
