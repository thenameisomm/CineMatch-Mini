import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

export async function startTestDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'cinematch-mini-test' });
  const { MovieModel } = await import('../shared/database/models/Movie.js');
  const { UserModel } = await import('../shared/database/models/User.js');
  const { WatchlistItemModel } = await import('../shared/database/models/WatchlistItem.js');
  const { RatingModel } = await import('../shared/database/models/Rating.js');
  await Promise.all([
    MovieModel.createIndexes(),
    UserModel.createIndexes(),
    WatchlistItemModel.createIndexes(),
    RatingModel.createIndexes(),
  ]);
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await mongod?.stop();
}
