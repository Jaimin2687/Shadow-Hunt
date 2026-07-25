import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { TelemetryEvent, UserRiskState, Alert, SoarAction, WSMessage } from '../types/events.js';

export class WSBroadcaster {
  private wss: WebSocketServer;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log(`[WS] Client connected. Total clients: ${this.getClientCount()}`);
      
      ws.on('close', () => {
        console.log(`[WS] Client disconnected. Total clients: ${this.getClientCount()}`);
      });

      ws.on('error', (err) => {
        console.error(`[WS] Client error:`, err);
      });
    });
  }

  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  broadcastEvent(event: TelemetryEvent, riskState: UserRiskState): void {
    this.broadcast({
      type: 'log_event',
      payload: { 
        ...event, 
        _risk_score: riskState.current_risk, 
        _risk_state: riskState 
      },
      timestamp: new Date().toISOString(),
      _t0_ns: event._t0_ns
    });
  }

  broadcastRiskUpdate(riskState: UserRiskState): void {
    this.broadcast({
      type: 'risk_update',
      payload: riskState,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAlert(alert: Alert): void {
    this.broadcast({
      type: 'alert',
      payload: alert,
      timestamp: new Date().toISOString()
    });
  }

  broadcastSoarAction(action: SoarAction, result: UserRiskState): void {
    this.broadcast({
      type: 'soar_action',
      payload: { action, result },
      timestamp: new Date().toISOString()
    });
  }

  getClientCount(): number {
    return this.wss.clients.size;
  }
}
