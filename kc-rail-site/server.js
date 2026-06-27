
require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_ORIGIN = process.env.APP_ORIGIN || '';
const IP_HASH_SECRET = process.env.IP_HASH_SECRET || 'change-me-before-production';

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "form-action": ["'self'"]
    }
  }
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (APP_ORIGIN) {
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin && origin !== APP_ORIGIN) return res.status(403).json({ error: 'Invalid request origin.' });
    return next();
  });
}

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' }
});

const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
}) : null;

async function ensureDatabase() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_feedback (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
      zip_code VARCHAR(10) NOT NULL CHECK (zip_code ~ '^\\d{5}(-\\d{4})?$'),
      email TEXT NOT NULL CHECK (char_length(email) <= 254),
      comments TEXT NOT NULL DEFAULT '',
      comment_word_count INTEGER NOT NULL CHECK (comment_word_count <= 256),
      ip_hash TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS support_feedback_created_at_idx ON support_feedback (created_at DESC);
    CREATE INDEX IF NOT EXISTS support_feedback_zip_code_idx ON support_feedback (zip_code);
  `);
}

function normalizeString(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countWords(value) {
  const match = normalizeString(value).match(/\S+/g);
  return match ? match.length : 0;
}

function validateSubmission(body) {
  const fullName = normalizeString(body.fullName);
  const zipCode = normalizeString(body.zipCode);
  const email = normalizeString(body.email).toLowerCase();
  const comments = normalizeString(body.comments);
  const honeypot = normalizeString(body.website);
  const wordCount = countWords(comments);

  if (honeypot) return { error: 'Submission rejected.' };
  if (fullName.length < 2 || fullName.length > 120) return { error: 'Please provide your full name.' };
  if (!/^\d{5}(-\d{4})?$/.test(zipCode)) return { error: 'Please provide a valid ZIP code.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please provide a valid email address.' };
  if (wordCount > 256) return { error: 'Comments must be 256 words or fewer.' };
  if (comments.length > 2000) return { error: 'Comments are too long.' };

  return { value: { fullName, zipCode, email, comments, wordCount } };
}

function hashIp(ip) {
  return crypto.createHmac('sha256', IP_HASH_SECRET).update(ip || '').digest('hex');
}

app.post('/api/support', limiter, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'The support database is not configured yet.' });

  const result = validateSubmission(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const { fullName, zipCode, email, comments, wordCount } = result.value;
  try {
    await pool.query(
      `INSERT INTO support_feedback
       (full_name, zip_code, email, comments, comment_word_count, ip_hash, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fullName, zipCode, email, comments, wordCount, hashIp(req.ip), String(req.get('user-agent') || '').slice(0, 500)]
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('support insert failed', error);
    return res.status(500).json({ error: 'Unable to save your submission right now.' });
  }
});

app.use(express.static(path.join(__dirname), { extensions: ['html'] }));
app.get('/', (req, res) => res.redirect(302, '/waldo-extension/'));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'waldo-extension', 'index.html')));

ensureDatabase()
  .then(() => app.listen(PORT, () => console.log(`KC Rail Future site listening on ${PORT}`)))
  .catch((error) => {
    console.error('Database initialization failed', error);
    process.exit(1);
  });
