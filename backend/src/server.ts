import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectToDatabase, disconnectFromDatabase } from './shared/database/connection.js';

async function main(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to MongoDB (${env.MONGODB_DB_NAME})`);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`CineMatch-Mini API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await disconnectFromDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
