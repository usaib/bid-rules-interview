import express from 'express';
import { campaignsRouter } from './routes/campaigns';
import { keywordsRouter } from './routes/keywords';
import { rulesRouter } from './routes/rules';
import { errorHandler, notFoundHandler } from './errors';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/campaigns/:campaignId/keywords', keywordsRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/rules', rulesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
