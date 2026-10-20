import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ipRateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { contentRouter } from './modules/movies/movies.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { watchlistRouter } from './modules/watchlist/watchlist.routes.js';
import { ratingsRouter } from './modules/ratings/ratings.routes.js';
import { historyRouter } from './modules/history/history.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { recommendationsRouter } from './modules/recommendations/recommendations.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';

export function createApp(): express.Application {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/api/v1/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  const v1 = express.Router();
  v1.use(ipRateLimiter);
  v1.use('/auth', authRouter);
  v1.use('/content', contentRouter);
  v1.use('/search', searchRouter);
  v1.use('/watchlist', watchlistRouter);
  v1.use('/ratings', ratingsRouter);
  v1.use('/history', historyRouter);
  v1.use('/users', usersRouter);
  v1.use('/recommendations', recommendationsRouter);
  // Mounted at /analytics to match the existing frontend; /stats is an alias.
  v1.use('/analytics', statsRouter);
  v1.use('/stats', statsRouter);
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
