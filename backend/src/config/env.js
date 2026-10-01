require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  DEMO_MODE: (process.env.DEMO_MODE || 'true').toLowerCase() !== 'false',
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // In-memory MongoDB is a demo convenience; a real MongoDB is preferred in production.
  ALLOW_IN_MEMORY_DB: (process.env.ALLOW_IN_MEMORY_DB || 'true').toLowerCase() !== 'false',
};

module.exports = env;
