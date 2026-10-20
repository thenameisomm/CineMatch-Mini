import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import * as controller from './movies.controller.js';
import { browseQuerySchema, idParamSchema } from './movies.schemas.js';

// Mounted at /content to match the existing frontend.
export const contentRouter = Router();

contentRouter.get('/', validate({ query: browseQuerySchema }), controller.browse);
contentRouter.get('/genres', controller.genres);
contentRouter.get('/trending', controller.trending);
contentRouter.get('/:id/similar', validate({ params: idParamSchema }), controller.similar);
contentRouter.get('/:id', validate({ params: idParamSchema }), controller.detail);
