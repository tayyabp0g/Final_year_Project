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
  max: 3, // 3 signup attempts per hour
  message: 'Too many signup attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
  if (req.body.username) {
    req.body.username = validator.trim(req.body.username).toLowerCase();
  }
  if (req.body.email) {
    req.body.email = validator.trim(req.body.email).toLowerCase();
  }
  if (req.body.password) {
    req.body.password = validator.trim(req.body.password);
  }
  if (req.body.message) {
    req.body.message = validator.trim(req.body.message);
  }
  if (req.body.response) {
    req.body.response = validator.trim(req.body.response);
  }
  next();
};

// SQL Injection prevention - Validate data
const validateAuthInput = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

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
