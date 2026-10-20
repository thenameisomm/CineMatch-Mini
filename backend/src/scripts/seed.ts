// Seed: loads the built-in catalog + a demo student account into the
// LOCAL `cinematch_mini` database. Idempotent — never deletes user data.
// Run: npm run db:seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectToDatabase, disconnectFromDatabase } from '../shared/database/connection.js';
import { MovieModel } from '../shared/database/models/Movie.js';
import { RatingModel } from '../shared/database/models/Rating.js';
import { UserModel } from '../shared/database/models/User.js';
import { WatchlistItemModel } from '../shared/database/models/WatchlistItem.js';
import { SEED_CONTENT } from './seed-data.js';

async function main(): Promise<void> {
  await connectToDatabase();

  const existing = await MovieModel.countDocuments();
  if (existing === 0) {
    for (const item of SEED_CONTENT) {
      const director = item.crew.find(c => c.job === 'Director')?.name;
      await MovieModel.create({
        tmdbId: item.tmdbId,
        type: item.type,
        title: item.title,
        overview: item.overview,
        releaseDate: new Date(item.releaseDate),
        runtime: item.runtime,
        genres: item.genres,
        keywords: item.keywords,
        cast: item.cast.map(c => ({ name: c.name, character: c.character })),
        director,
        popularity: item.popularity,
        voteAverage: item.voteAverage,
        voteCount: item.voteCount,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        language: 'en',
      });
    }
    console.log(`Seeded ${SEED_CONTENT.length} movies`);
  } else {
    console.log(`movies collection not empty (${existing} docs) — catalog seed skipped`);
  }

  // Demo account: student@cinematch.mini / Student@1234
  const email = 'student@cinematch.mini';
  let demo = await UserModel.findOne({ email });
  if (!demo) {
    demo = await UserModel.create({
      email,
      username: 'student',
      passwordHash: await bcrypt.hash('Student@1234', 10),
      displayName: 'Demo Student',
      preferences: {
        favoriteGenres: [878, 18, 28],
        preferredLanguages: ['en'],
        contentTypes: ['movie', 'tv'],
      },
    });
    console.log('Created demo account (student@cinematch.mini / Student@1234)');
  }

  const byTitle = (title: string) => MovieModel.findOne({ title }).select('_id').lean();
  const interstellar = await byTitle('Interstellar');
  const inception = await byTitle('Inception');
  const darkKnight = await byTitle('The Dark Knight');

  if (interstellar) {
    await RatingModel.findOneAndUpdate(
      { userId: demo._id, movieId: interstellar._id },
      { $set: { score: 9, review: 'Ambitious, emotional, scientifically fascinating.' } },
      { upsert: true }
    );
  }
  if (inception) {
    await WatchlistItemModel.findOneAndUpdate(
      { userId: demo._id, movieId: inception._id },
      { $set: { status: 'completed', progress: 100 } },
      { upsert: true }
    );
  }
  if (darkKnight) {
    await WatchlistItemModel.findOneAndUpdate(
      { userId: demo._id, movieId: darkKnight._id },
      { $set: { status: 'watching', progress: 40 } },
      { upsert: true }
    );
  }
  const [w, r] = await Promise.all([
    WatchlistItemModel.countDocuments({ userId: demo._id }),
    RatingModel.countDocuments({ userId: demo._id }),
  ]);
  await UserModel.updateOne(
    { _id: demo._id },
    { $set: { 'stats.watchlistCount': w, 'stats.ratingsCount': r } }
  );

  console.log(`Seed complete. Movies: ${await MovieModel.countDocuments()}`);
  await disconnectFromDatabase();
}

main().catch(async error => {
  console.error('Seed failed', error);
  await disconnectFromDatabase();
  process.exit(1);
});
