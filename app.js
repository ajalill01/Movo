// const dotenv = require('dotenv');
// const createAdmin = require('./backend/controllers/add-admin');

// createAdmin();

require("dotenv").config();
const express = require("express");
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sanitize = require('./backend/middleware/sanitize'); 
const helmet = require('helmet');

const app = express();


app.use(helmet());
app.set('trust proxy', 1);
app.use(express.json()); 
app.use(cors());
app.use(sanitize);

// const categoryRoutes = require('./backend/routes/category-routes');
const financeRoutes = require('./backend/routes/finance-routes');
const orderRoutes = require('./backend/routes/order-routes');


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  validate: { trustProxy: true } 
});
app.use(globalLimiter);


app.use('/api/auth', require('./backend/routes/auth-route'));
app.use('/api/categories', require('./backend/routes/category-routes'));
app.use('/api/products', require('./backend/routes/product-routes'));
app.use('/api/finances', financeRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/cars', require('./backend/routes/car-route'));
// app.use('/api/products', require('./backend/routes/product-route'));
// app.use('/api/orders', require('./backend/routes/orders-route'));
// app.use("/api/stats", require("./backend/routes/statsRoute"));


const PORT = process.env.PORT || 3000;
require("./backend/database/db.js")(); 
app.listen(PORT, () => console.log("Server is running on port", PORT));

// const { initializeFinanceRecord } = require('./backend/controllers/finance-controller');


//   initializeFinanceRecord();