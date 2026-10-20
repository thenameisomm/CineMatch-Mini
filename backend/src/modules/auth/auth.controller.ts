import { Request, Response } from 'express';
import { catchAsync } from '../../middleware/catchAsync.js';
import { cookieOptions } from '../../shared/auth/tokens.js';
import * as service from './auth.service.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

function setSessionCookies(res: Response, accessToken: string, refreshRaw: string): void {
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshRaw, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearSessionCookies(res: Response): void {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await service.register((req.validated?.body ?? req.body) as RegisterInput);
  setSessionCookies(res, result.accessToken, result.refreshRaw);
  res.status(201).json({ success: true, data: { user: result.user } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await service.login((req.validated?.body ?? req.body) as LoginInput);
  setSessionCookies(res, result.accessToken, result.refreshRaw);
  res.json({ success: true, data: { user: result.user } });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const result = await service.refresh(req.cookies?.refreshToken);
  setSessionCookies(res, result.accessToken, result.refreshRaw);
  res.json({ success: true, data: { user: result.user } });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await service.logout(req.cookies?.refreshToken);
  clearSessionCookies(res);
  res.json({ success: true, data: { message: 'Logged out' } });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await service.me(req.user!.id);
  res.json({ success: true, data: { user } });
});
