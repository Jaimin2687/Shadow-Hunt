import { RiskAccumulator } from './riskAccumulator.js';
import { WSBroadcaster } from '../ws/broadcaster.js';
import { SoarAction, UserRiskState } from '../types/events.js';

export class SoarDispatcher {
  constructor(private riskAccumulator: RiskAccumulator, private broadcaster: WSBroadcaster) {}

  async executeAction(action: SoarAction): Promise<{ success: boolean; message: string; userState?: UserRiskState }> {
    try {
      console.log(`[SOAR] Executing action ${action.action} for user ${action.target_user_id}`);
      
      const updatedState = this.riskAccumulator.applyAction(action.target_user_id, action);
      if (!updatedState) {
        return { success: false, message: `User ${action.target_user_id} not found.` };
      }

      this.broadcaster.broadcastSoarAction(action, updatedState);
      this.broadcaster.broadcastRiskUpdate(updatedState);

      return { success: true, message: `Action ${action.action} applied successfully`, userState: updatedState };
    } catch (err: any) {
      console.error('[SOAR] Error executing action:', err);
      return { success: false, message: err.message || 'Internal error applying action' };
    }
  }
}
