require("dotenv").config();
const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sanitize = require('./backend/middleware/sanitize'); 
const helmet = require('helmet');
const jwt = require('jsonwebtoken'); // Added missing jwt require
const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json()); 
app.use(cors());
app.use(sanitize);

// Serve static assets only (CSS, JS, images)
app.use('/assets', express.static(path.join(__dirname, 'docs', 'assets')));

// Dynamic route handlers
const financeRoutes = require('./backend/routes/finance-routes');
const orderRoutes = require('./backend/routes/order-routes');

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Admin dashboard routes - keep your existing auth logic
const verifyAdminToken = (req, res, next) => {
  const publicRoutes = [
    '/docs/admin-dashboard/login.html',
    '/docs/admin-dashboard/reset.html',
    '/docs/admin-dashboard/verify.html',
    '/docs/admin-dashboard/new-password.html'
  ];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/docs/admin-dashboard/login.html');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.redirect('/docs/admin-dashboard/login.html');
  }
};

// Explicitly handle admin routes
app.get('/docs/admin-dashboard/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'admin-dashboard', 'login.html'));
});

app.get('/docs/admin-dashboard/reset.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'admin-dashboard', 'reset.html'));
});

app.get('/docs/admin-dashboard/verify.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'admin-dashboard', 'verify.html'));
});

app.get('/docs/admin-dashboard/new-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'admin-dashboard', 'new-password.html'));
});

// Apply auth middleware to protected admin routes
app.use('/docs/admin-dashboard', verifyAdminToken);

// API routes (unchanged)
app.use('/api/auth', require('./backend/routes/auth-route'));
app.use('/api/categories', require('./backend/routes/category-routes'));
app.use('/api/products', require('./backend/routes/product-routes'));
app.use('/api/finances', financeRoutes);
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.PORT || 3000;
require("./backend/database/db.js")()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Admin login: http://localhost:${PORT}/docs/admin-dashboard/login.html`);
    });
  })
  .catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });