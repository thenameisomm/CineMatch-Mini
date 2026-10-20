import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { catchAsync } from '../../middleware/catchAsync.js';
import { UserModel } from '../../shared/database/models/User.js';
import { WatchlistItemModel } from '../../shared/database/models/WatchlistItem.js';
import { RatingModel } from '../../shared/database/models/Rating.js';
import { UnauthorizedError } from '../../shared/errors/AppError.js';
import { updateMe } from '../auth/auth.service.js';

const patchBody = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  preferences: z
    .object({
      favoriteGenres: z.array(z.number()).optional(),
      preferredLanguages: z.array(z.string()).optional(),
      contentTypes: z.array(z.enum(['movie', 'tv'])).optional(),
    })
    .optional(),
});

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get(
  '/me',
  catchAsync(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).lean();
    if (!user) throw new UnauthorizedError();
    const safe = { ...user, id: String(user._id) };
    delete (safe as Record<string, unknown>).passwordHash;
    delete (safe as Record<string, unknown>).refreshTokens;
    res.json({ success: true, data: { user: safe } });
  })
);

usersRouter.patch(
  '/me',
  validate({ body: patchBody }),
  catchAsync(async (req, res) => {
    const user = await updateMe(
      req.user!.id,
      (req.validated?.body ?? req.body) as Parameters<typeof updateMe>[1]
    );
    res.json({ success: true, data: { user } });
  })
);

usersRouter.get(
  '/me/stats',
  catchAsync(async (req, res) => {
    const userId = req.user!.id;
    const [watchlistCount, ratingsCount, user] = await Promise.all([
      WatchlistItemModel.countDocuments({ userId }),
      RatingModel.countDocuments({ userId }),
      UserModel.findById(userId).select('stats').lean(),
    ]);
    res.json({
      success: true,
      data: {
        watchlistCount,
        ratingsCount,
        historyEntries: 0,
        watchTimeMinutes: user?.stats?.watchTimeMinutes ?? 0,
      },
    });
  })
);
