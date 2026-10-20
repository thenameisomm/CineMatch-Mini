import mongoose from 'mongoose';
import { env } from '../../config/env.js';

export async function connectToDatabase(uri: string = env.MONGODB_URI): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { dbName: env.MONGODB_DB_NAME });
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
