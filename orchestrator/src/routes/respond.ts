import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SoarAction } from '../types/events.js';
import { SoarDispatcher } from '../services/soarDispatcher.js';
import { logger } from '../utils/logger.js';

const VALID_ACTIONS = new Set(['ISOLATE_ACCOUNT', 'REVOKE_SESSION', 'FLAG_AUDIT', 'STEP_UP_AUTH']);

const respondSchema = z.object({
  action: z.string().refine(val => VALID_ACTIONS.has(val), { 
    message: "Invalid action. Allowed values: ISOLATE_ACCOUNT, REVOKE_SESSION, FLAG_AUDIT, STEP_UP_AUTH" 
  }),
  target_user_id: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Invalid target_user_id format"),
  analyst_note: z.string().optional()
});

export function createRespondRouter(soarDispatcher: SoarDispatcher) {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const parsed = respondSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0].message });
        return;
      }
      
      const body = parsed.data;

      const action: SoarAction = {
        action: body.action as SoarAction['action'],
        target_user_id: body.target_user_id,
        analyst_note: body.analyst_note || 'Manual trigger from dashboard'
      };
      if (!action.target_user_id) {
        res.status(400).json({ error: 'Invalid SOAR action structure: missing target_user_id' });
        return;
      }

      logger.info('Triggered SOAR action', { 
        context: { 
          action_type: action.action, 
          target_user_id: action.target_user_id, 
          actor: 'dashboard' 
        } 
      });

      const result = await soarDispatcher.executeAction(action);
      if (!result.success) {
        res.status(404).json(result);
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error processing SOAR action', { error });
      res.status(500).json({ error: 'Internal server error processing response' });
    }
  });

  return router;
}
