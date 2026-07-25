import { RiskAccumulator } from './riskAccumulator.js';
import { WSBroadcaster } from '../ws/broadcaster.js';
import { logger } from '../utils/logger.js';
import { SoarAction, SoarResult } from '../types/events.js';

export class SoarDispatcher {
  constructor(private riskAccumulator: RiskAccumulator, private broadcaster: WSBroadcaster) {}

  async executeAction(action: SoarAction): Promise<SoarResult> {
    try {
      logger.info(`Executing action ${action.action} for user ${action.target_user_id}`, { context: { action: action.action, target_user_id: action.target_user_id }});
      
      const updatedState = this.riskAccumulator.applyAction(action.target_user_id, action);
      if (!updatedState) {
        return { success: false, message: `User ${action.target_user_id} not found.` };
      }

      this.broadcaster.broadcastSoarAction(action, updatedState);
      this.broadcaster.broadcastRiskUpdate(updatedState);

      return { success: true, message: `Action ${action.action} applied successfully`, userState: updatedState };
    } catch (err: any) {
      logger.error('Error executing SOAR action', { context: { error: err.message }});
      return { success: false, message: err.message || 'Internal error applying action' };
    }
  }
}
