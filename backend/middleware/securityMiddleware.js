const rateLimit = require('express-rate-limit');
const validator = require('validator');

// Rate limiting middleware - Prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Increased for testing - change back to 3 in production
  message: 'Too many signup attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX || '120', 10), // per minute
  message: 'Too many requests. Please slow down.',
  skip: (req) => req.method === 'GET', // allow sidebar/history fetches
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
  const body = req.body || {};
  // Only trim inputs - do NOT lowercase them here, let controllers handle normalization
  if (body.username) {
    body.username = validator.trim(body.username);
  }
  if (body.email) {
    body.email = validator.trim(body.email);
  }
  if (body.password) {
    body.password = validator.trim(body.password);
  }
  if (body.message) {
    body.message = validator.trim(body.message);
  }
  if (body.response) {
    body.response = validator.trim(body.response);
  }
  if (body.confirmPassword) {
    body.confirmPassword = validator.trim(body.confirmPassword);
  }

  req.body = body;
  next();
};

// SQL Injection prevention - Validate data
const validateAuthInput = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body || {};

  if (username && typeof username !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid username format' });
  }

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (password && typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid password format' });
  }

  next();
};

module.exports = {
  loginLimiter,
  signupLimiter,
  chatLimiter,
  sanitizeInput,
  validateAuthInput,
};
