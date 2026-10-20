import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken {
  token: string; // sha256 hash of the raw token
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  bio?: string;
  preferences: {
    favoriteGenres: number[];
    preferredLanguages: string[];
    contentTypes: ('movie' | 'tv')[];
  };
  stats: { watchlistCount: number; ratingsCount: number; watchTimeMinutes: number };
  refreshTokens: IRefreshToken[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, trim: true, maxlength: 50 },
    bio: { type: String, trim: true, maxlength: 500 },
    preferences: {
      favoriteGenres: { type: [Number], default: [] },
      preferredLanguages: { type: [String], default: [] },
      contentTypes: { type: [String], enum: ['movie', 'tv'], default: ['movie', 'tv'] },
    },
    stats: {
      watchlistCount: { type: Number, default: 0, min: 0 },
      ratingsCount: { type: Number, default: 0, min: 0 },
      watchTimeMinutes: { type: Number, default: 0, min: 0 },
    },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'users' }
);

// DEMO: index for refresh-token expiry lookup.
UserSchema.index({ 'refreshTokens.expiresAt': 1 });

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;
