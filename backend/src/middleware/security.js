const rateLimit = require('express-rate-limit');

/**
 * Rate limiting strategy
 *
 * Reads are generous (the dashboard fans out several requests per page) while
 * writes — investigation runs, human-review decisions, copilot queries — are
 * strictly limited, since those are the expensive and state-changing calls.
 */

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later' },
});

/** Applies `writeLimiter` to mutating verbs only. */
function limitWrites(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    return writeLimiter(req, res, next);
  }
  return next();
}

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

// Request logging
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
}

module.exports = { readLimiter, writeLimiter, limitWrites, securityHeaders, requestLogger };
