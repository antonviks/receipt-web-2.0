// server/middleware/auth.js
//
// Shared-password login, checked on the server.
// A successful login sets a signed, httpOnly cookie, so no database or
// session store is needed. Changing APP_PASSWORD or SESSION_SECRET logs
// everyone out.

const crypto = require('crypto');

const COOKIE_NAME = 'korsredo_auth';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

// Constant-time comparison that also works for strings of different length
function safeEqual(a, b) {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function parseCookies(header = '') {
  const cookies = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i === -1) return;
    const key = part.slice(0, i).trim();
    try {
      cookies[key] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      // ignore malformed cookie values
    }
  });
  return cookies;
}

// Small in-memory rate limiter: at most `limit` hits per `windowMs` per key.
// Good enough for a single server instance.
function createRateLimiter({ windowMs, limit }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.reset <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return {
    isLimited(key) {
      const entry = hits.get(key);
      return Boolean(entry && entry.reset > Date.now() && entry.count >= limit);
    },
    hit(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.reset <= now) {
        hits.set(key, { count: 1, reset: now + windowMs });
      } else {
        entry.count += 1;
      }
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

function createAuth({ password, secret, secureCookies }) {
  // The signing key depends on both the secret and the password
  const signingKey = sha256(`${secret}\0${password}`);
  const sign = (value) =>
    crypto.createHmac('sha256', signingKey).update(value).digest('base64url');

  const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/' };

  function isAuthenticated(req) {
    const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
    if (!token) return false;
    const [expires, signature] = token.split('.');
    if (!expires || !signature) return false;
    if (!safeEqual(signature, sign(expires))) return false;
    return Number(expires) > Date.now();
  }

  function login(req, res) {
    const ip = req.ip;
    if (loginLimiter.isLimited(ip)) {
      return res
        .status(429)
        .json({ error: 'För många inloggningsförsök. Försök igen om en stund.' });
    }

    const supplied = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!safeEqual(supplied, password)) {
      loginLimiter.hit(ip);
      return res.status(401).json({ error: 'Fel lösenord.' });
    }

    loginLimiter.reset(ip);
    const expires = String(Date.now() + SESSION_MS);
    res.cookie(COOKIE_NAME, `${expires}.${sign(expires)}`, {
      ...cookieOptions,
      maxAge: SESSION_MS,
    });
    return res.json({ ok: true });
  }

  function logout(req, res) {
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ ok: true });
  }

  function session(req, res) {
    res.set('Cache-Control', 'no-store');
    res.json({ authenticated: isAuthenticated(req) });
  }

  function requireAuth(req, res, next) {
    if (isAuthenticated(req)) return next();
    return res.status(401).json({ error: 'Du är inte inloggad. Logga in igen.' });
  }

  return { login, logout, session, requireAuth };
}

module.exports = { createAuth, createRateLimiter };
