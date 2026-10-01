const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

async function main() {
  await connectDB();

  // Auto-seed if the database is empty (demo convenience)
  const Investigation = require('./models/Investigation');
  const count = await Investigation.countDocuments();
  if (count === 0) {
    console.log('[seed] Database empty — running seed...');
    const { seed } = require('../seed/seed');
    await seed();
  }

  app.listen(env.PORT, () => {
    console.log(`[server] FraudLens API listening on http://localhost:${env.PORT}`);
    console.log(`[server] DEMO_MODE=${env.DEMO_MODE}`);
  });
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
