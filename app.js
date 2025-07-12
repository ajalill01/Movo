require("dotenv").config();
const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sanitize = require('./backend/middleware/sanitize'); 
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Your exact original middleware setup
app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json()); 
app.use(cors());
app.use(sanitize);

// Keep your original static file serving exactly as is
app.use(express.static(path.join(__dirname, 'docs'))); 

// Your original root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html')); 
});

// Your original routes
const financeRoutes = require('./backend/routes/finance-routes');
const orderRoutes = require('./backend/routes/order-routes');

// Your original verifyAdminToken middleware
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

// Your original route mounting
app.use('/docs/admin-dashboard', verifyAdminToken);
app.use('/api/auth', require('./backend/routes/auth-route'));
app.use('/api/categories', require('./backend/routes/category-routes'));
app.use('/api/products', require('./backend/routes/product-routes'));
app.use('/api/finances', financeRoutes);
app.use('/api/orders', orderRoutes);

// Your original server startup
const PORT = process.env.PORT || 3000;
require("./backend/database/db.js")(); 
app.listen(PORT, () => console.log("Server is running on port", PORT));