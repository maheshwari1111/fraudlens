const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

/**
 * Connects to MongoDB. If MONGODB_URI is set, uses it; otherwise spins up an
 * in-memory MongoDB (mongodb-memory-server) so the app runs with zero setup.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection.name;
  let uri = env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[db] Using in-memory MongoDB (no MONGODB_URI configured)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'fraudlens' });
  console.log('[db] Connected to MongoDB');
  return uri;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
