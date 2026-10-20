// Poster backfill: fills `posterPath` on existing movie records WITHOUT
// touching anything else. Safe to run repeatedly.
// - Updates ONLY the posterPath field of the 21 seeded titles that have a
//   verified poster (see seed-data.ts). Titles without a verified poster
//   (The Grand Budapest Hotel, The Martian, Whiplash) are left alone so the
//   UI keeps showing the honest placeholder.
// - NEVER deletes, NEVER drops collections, NEVER touches users,
//   watchlist items, or ratings. Creates no duplicate movies.
// Run: npm run db:posters
import 'dotenv/config';
import { connectToDatabase, disconnectFromDatabase } from '../shared/database/connection.js';
import { MovieModel } from '../shared/database/models/Movie.js';
import { SEED_CONTENT } from './seed-data.js';

async function main(): Promise<void> {
  await connectToDatabase();
  let updated = 0;
  let alreadyOk = 0;
  for (const item of SEED_CONTENT) {
    if (!item.posterPath) continue; // no verified poster → keep placeholder
    const res = await MovieModel.updateOne(
      { title: item.title, $or: [{ posterPath: { $exists: false } }, { posterPath: null }] },
      { $set: { posterPath: item.posterPath } }
    );
    if (res.modifiedCount > 0) updated += 1;
    else alreadyOk += 1;
  }
  console.log(`Poster backfill complete. Updated: ${updated}, already had posters: ${alreadyOk}`);
  await disconnectFromDatabase();
}

main().catch(async error => {
  console.error('Poster backfill failed', error);
  await disconnectFromDatabase();
  process.exit(1);
});
