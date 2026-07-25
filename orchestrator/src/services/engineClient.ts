import { config } from '../config.js';
import { TelemetryEvent, AnomalyResponse } from '../types/events.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';
import CircuitBreaker from 'opossum';

const engineHttpClient = axios.create({
  baseURL: config.ENGINE_URL,
  timeout: 2000
});

export class EngineClient {
  private breaker: CircuitBreaker;

  constructor() {
    const options = {
      timeout: 2000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000
    };

    const makeRequest = async (event: TelemetryEvent) => {
      const res = await engineHttpClient.post('/api/v1/score', event);
      return res.data as AnomalyResponse;
    };

    this.breaker = new CircuitBreaker(makeRequest, options);

    this.breaker.fallback((event: TelemetryEvent, err: Error) => {
      logger.warn('Circuit breaker fallback triggered / Engine DEGRADED', { 
        context: { error: err?.message, user_id: event.actor.user_id } 
      });
      
      return {
        user_id: event.actor.user_id,
        risk_score: 0,
        is_anomaly: false,
        severity: 'INFORMATIONAL',
        breakdown: {
          novelty_score: 0, temporal_anomaly: 0,
          volume_max_z: 0, pyod_percentile: 0, peer_deviation: 0
        },
        recommended_action: 'MONITOR'
      } as AnomalyResponse;
    });

    this.breaker.on('open', () => logger.warn('Circuit breaker OPEN'));
    this.breaker.on('halfOpen', () => logger.warn('Circuit breaker HALF-OPEN'));
    this.breaker.on('close', () => logger.info('Circuit breaker CLOSED'));
  }

  async scoreEvent(event: TelemetryEvent): Promise<AnomalyResponse> {
    return (await this.breaker.fire(event)) as AnomalyResponse;
  }
}
