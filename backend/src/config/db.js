const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

/**
 * Connects to MongoDB.
 *
 * If MONGODB_URI is set, that instance is used. Otherwise an in-memory MongoDB
 * (mongodb-memory-server) is started so the project runs with zero setup — this
 * is a demo convenience, and it is disabled automatically in production unless
 * ALLOW_IN_MEMORY_DB=true is set explicitly (in-memory data is not persistent).
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection.name;

  let uri = env.MONGODB_URI;

  if (!uri) {
    if (env.NODE_ENV === 'production' && !env.ALLOW_IN_MEMORY_DB) {
      throw new Error(
        'MONGODB_URI is required in production. Set MONGODB_URI, or set ALLOW_IN_MEMORY_DB=true to run with a non-persistent in-memory database.'
      );
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[db] Using in-memory MongoDB (no MONGODB_URI configured) — data resets on restart');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'fraudlens' });
  console.log('[db] Connected to MongoDB');
  return uri;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  memoryServer = null;
}

/** True when connected to the in-memory instance. */
function isInMemory() {
  return memoryServer !== null;
}

module.exports = { connectDB, disconnectDB, isInMemory };
