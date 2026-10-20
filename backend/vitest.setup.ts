// Test env: set BEFORE config/env.ts is imported (it throws on missing vars).
process.env['NODE_ENV'] ??= 'test';
process.env['MONGODB_URI'] ??= 'mongodb://127.0.0.1:27017/cinematch-mini-test';
process.env['MONGODB_DB_NAME'] ??= 'cinematch-mini-test';
process.env['JWT_ACCESS_SECRET'] ??= 'test-access-secret-0123456789abcdef';
process.env['JWT_REFRESH_SECRET'] ??= 'test-refresh-secret-0123456789abcdef';
process.env['AUTH_RATE_LIMIT_MAX'] ??= '1000';
process.env['RATE_LIMIT_MAX_REQUESTS'] ??= '10000';
