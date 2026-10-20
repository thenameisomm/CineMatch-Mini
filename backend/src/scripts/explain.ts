// db:explain — read-only viva helper: prints query execution plans
// (explain("executionStats")) for the representative queries the app runs.
//
// SAFE: only reads + ensures indexes (createIndexes is idempotent and never
// deletes data). Needs local MongoDB running (`docker compose up -d`).
// Run: npm run db:explain --workspace=backend
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../shared/database/connection.js';
import { MovieModel } from '../shared/database/models/Movie.js';
import { UserModel } from '../shared/database/models/User.js';
import { WatchlistItemModel } from '../shared/database/models/WatchlistItem.js';
import { RatingModel } from '../shared/database/models/Rating.js';

type Plan = Record<string, unknown>;

function stages(plan: Plan, out: string[] = []): string[] {
  if (typeof plan['stage'] === 'string') out.push(plan['stage'] as string);
  const input = plan['inputStage'] as Plan | undefined;
  if (input && typeof input === 'object') stages(input, out);
  const inputs = plan['inputStages'] as Plan[] | undefined;
  if (Array.isArray(inputs)) for (const s of inputs) stages(s, out);
  return out;
}

function summarize(name: string, stats: Plan): void {
  const plan = stats['queryPlanner'] as Plan | undefined;
  const exec = stats['executionStats'] as Plan | undefined;
  const won = ((plan?.['winningPlan'] as Plan | undefined) ?? {}) as Plan;
  console.log(`\n### ${name}`);
  console.log(`stages: ${(stages(won).join(' -> ') || '(aggregation)') as string}`);
  if (exec) {
    console.log(
      `nReturned=${String(exec['nReturned'])} ` +
        `keysExamined=${String(exec['totalKeysExamined'])} ` +
        `docsExamined=${String(exec['totalDocsExamined'])} ` +
        `timeMs=${String(exec['executionTimeMillis'])}`
    );
  }
}

async function main(): Promise<void> {
  await connectToDatabase();
  // Idempotent: builds only missing indexes, never touches documents.
  await Promise.all([
    MovieModel.createIndexes(),
    UserModel.createIndexes(),
    WatchlistItemModel.createIndexes(),
    RatingModel.createIndexes(),
  ]);
  const indexNames = await MovieModel.collection.listIndexes().toArray();
  console.log('Indexes on movies:', indexNames.map(i => i.name).join(', '));
  console.log(`movies docs: ${await MovieModel.countDocuments()}`);

  const sampleUser = await UserModel.findOne().select('_id').lean();
  const userId = sampleUser?._id ?? new mongoose.Types.ObjectId();
  const sampleMovie = await MovieModel.findOne().select('_id').lean();
  const movieId = sampleMovie?._id ?? new mongoose.Types.ObjectId();

  summarize(
    '1. title text search  ($text, GET /search?q=...)',
    (await MovieModel.find({ $text: { $search: 'space' } })
      .limit(20)
      .explain('executionStats')) as unknown as Plan
  );
  summarize(
    '2. genre filter + popularity sort (GET /content?genre=28)',
    (await MovieModel.find({ 'genres.id': 28 })
      .sort({ popularity: -1 })
      .limit(20)
      .explain('executionStats')) as unknown as Plan
  );
  summarize(
    "3. user's watchlist lookup (GET /watchlist)",
    (await WatchlistItemModel.find({ userId }).explain('executionStats')) as unknown as Plan
  );
  summarize(
    '4. ratings by movie (rating stats)',
    (await RatingModel.find({ movieId }).explain('executionStats')) as unknown as Plan
  );
  summarize(
    '5. genre counts aggregation (GET /content/genres)',
    (await MovieModel.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres.id', name: { $first: '$genres.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).explain('executionStats')) as unknown as Plan
  );

  console.log('\nRead IXSCAN (index used) vs COLLSCAN (full collection scan) above.');
  await disconnectFromDatabase();
}

main().catch(async error => {
  console.error('db:explain failed (is local MongoDB running?)', error);
  await disconnectFromDatabase();
  process.exit(1);
});
