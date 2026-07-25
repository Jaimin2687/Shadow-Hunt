import { Router, Request, Response } from 'express';
import { RiskAccumulator } from '../services/riskAccumulator.js';

export function getUsersRouter(riskAccumulator: RiskAccumulator) {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    res.json(riskAccumulator.getAllUsers());
  });

  router.get('/top/:n', (req: Request, res: Response) => {
    const n = parseInt(req.params.n as string, 10);
    if (isNaN(n) || n <= 0) {
      res.status(400).json({ error: 'Invalid top number specified' });
      return;
    }
    res.json(riskAccumulator.getTopRiskyUsers(n));
  });

  router.get('/:userId', (req: Request, res: Response) => {
    const user = riskAccumulator.getUser(req.params.userId as string);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  });

  return router;
}
