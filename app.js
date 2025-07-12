// const dotenv = require('dotenv');
// const createAdmin = require('./backend/controllers/add-admin');

// createAdmin();

require("dotenv").config();
const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const sanitize = require('./backend/middleware/sanitize'); 
const helmet = require('helmet');

const app = express();


app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json()); 
app.use(cors());
app.use(sanitize);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});

// const categoryRoutes = require('./backend/routes/category-routes');
const financeRoutes = require('./backend/routes/finance-routes');
const orderRoutes = require('./backend/routes/order-routes');


// const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests, please try again later.',
//   validate: { trustProxy: true } 
// });
// app.use(globalLimiter);

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

app.use('/docs/admin-dashboard', verifyAdminToken);

app.use('/api/auth', require('./backend/routes/auth-route'));
app.use('/api/categories', require('./backend/routes/category-routes'));
app.use('/api/products', require('./backend/routes/product-routes'));
app.use('/api/finances', financeRoutes);
app.use('/api/orders', orderRoutes);



const PORT = process.env.PORT || 3000;
require("./backend/database/db.js")(); 
app.listen(PORT, () => console.log("Server is running on port", PORT));

// const { initializeFinanceRecord } = require('./backend/controllers/finance-controller');


//   initializeFinanceRecord();