import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { UserModel } from '../../shared/database/models/User.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js';
import { hashToken, signAccessToken, signRefreshToken } from '../../shared/auth/tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

function publicUser(user: {
  _id: unknown;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  preferences: unknown;
  stats: unknown;
}) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    preferences: user.preferences,
    stats: user.stats,
  };
}

async function issueSession(userId: string, email: string) {
  const accessToken = signAccessToken(userId, email);
  const { raw, hash, expiresAt } = signRefreshToken();
  await UserModel.updateOne(
    { _id: userId },
    {
      $push: { refreshTokens: { $each: [{ token: hash, expiresAt }], $slice: -5 } },
      $set: { lastLoginAt: new Date() },
    }
  );
  return { accessToken, refreshRaw: raw };
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await UserModel.findOne({
    $or: [{ email }, { username: input.username }],
  }).lean();
  if (existing) throw new ConflictError('Email or username already taken');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_COST);
  const user = await UserModel.create({
    email,
    username: input.username,
    passwordHash,
    displayName: input.displayName || input.username,
  });
  const session = await issueSession(String(user._id), user.email);
  return { user: publicUser(user), ...session };
}

export async function login(input: LoginInput) {
  const user = await UserModel.findOne({ email: input.email.toLowerCase().trim() }).select(
    '+passwordHash'
  );
  if (!user) throw new UnauthorizedError('Invalid email or password');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Invalid email or password');
  const session = await issueSession(String(user._id), user.email);
  const fresh = await UserModel.findById(user._id);
  if (!fresh) throw new UnauthorizedError('Invalid email or password');
  return { user: publicUser(fresh), ...session };
}

export async function refresh(refreshRaw: string | undefined) {
  if (!refreshRaw) throw new UnauthorizedError('Missing refresh token');
  const hash = hashToken(refreshRaw);
  const user = await UserModel.findOne({ 'refreshTokens.token': hash });
  if (!user) throw new UnauthorizedError('Invalid refresh token');
  const stored = user.refreshTokens.find(t => t.token === hash);
  if (!stored || stored.expiresAt < new Date())
    throw new UnauthorizedError('Refresh token expired');

  // Rotation: drop the used token, issue a new pair (two updates — Mongo
  // forbids $pull and $push on the same path in one update).
  const accessToken = signAccessToken(String(user._id), user.email);
  const next = signRefreshToken();
  await UserModel.updateOne({ _id: user._id }, { $pull: { refreshTokens: { token: hash } } });
  await UserModel.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: { $each: [{ token: next.hash, expiresAt: next.expiresAt }], $slice: -5 },
      },
    }
  );
  return { accessToken, refreshRaw: next.raw, user: publicUser(user) };
}

export async function logout(refreshRaw: string | undefined): Promise<void> {
  if (!refreshRaw) return;
  await UserModel.updateOne(
    { 'refreshTokens.token': hashToken(refreshRaw) },
    { $pull: { refreshTokens: { token: hashToken(refreshRaw) } } }
  );
}

export async function me(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw new UnauthorizedError();
  return publicUser(user);
}

export async function updateMe(
  userId: string,
  patch: { displayName?: string; bio?: string; preferences?: Record<string, unknown> }
) {
  if (patch.preferences !== undefined && typeof patch.preferences !== 'object') {
    throw new ValidationError('Invalid preferences');
  }
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.bio !== undefined && { bio: patch.bio }),
        ...(patch.preferences !== undefined && { preferences: patch.preferences }),
      },
    },
    { new: true, runValidators: true }
  ).lean();
  if (!user) throw new UnauthorizedError();
  return publicUser(user);
}
