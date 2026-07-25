import { Router, Request, Response } from 'express';
import { SoarAction } from '../types/events.js';
import { SoarDispatcher } from '../services/soarDispatcher.js';

export function createRespondRouter(soarDispatcher: SoarDispatcher) {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const action: SoarAction = {
        action: body.action,
        target_user_id: body.target_user_id || body.targetUserId,
        analyst_note: body.analyst_note || body.note || 'Manual trigger from dashboard'
      };
      if (!action || !action.action || !action.target_user_id) {
        res.status(400).json({ error: 'Invalid SOAR action structure: missing action or target_user_id' });
        return;
      }

      const result = await soarDispatcher.executeAction(action);
      if (!result.success) {
        res.status(404).json(result);
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('[Respond] Error processing SOAR action:', error);
      res.status(500).json({ error: 'Internal server error processing response' });
    }
  });

  return router;
}
