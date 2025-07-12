require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const cors = require("cors");
const sanitize = require("./backend/middleware/sanitize");

const app = express();

// Security middleware
app.use(helmet());
app.set("trust proxy", 1);
app.use(express.json()); 
app.use(cors());
app.use(sanitize);

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "index.html"));
});

// Auth middleware
const verifyAdminToken = (req, res, next) => {
  const publicRoutes = [
    "/docs/admin-dashboard/login.html",
    "/docs/admin-dashboard/reset.html",
    "/docs/admin-dashboard/verify.html",
    "/docs/admin-dashboard/new-password.html"
  ];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.redirect("/docs/admin-dashboard/login.html");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.redirect("/docs/admin-dashboard/login.html");
  }
};

// Admin routes
app.get("/docs/admin-dashboard/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "admin-dashboard", "login.html"));
});

app.get("/docs/admin-dashboard/reset.html", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "admin-dashboard", "reset.html"));
});

app.get("/docs/admin-dashboard/verify.html", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "admin-dashboard", "verify.html"));
});

app.get("/docs/admin-dashboard/new-password.html", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "admin-dashboard", "new-password.html"));
});

// API routes
app.use("/api/auth", require("./backend/routes/auth-route"));
app.use("/api/categories", require("./backend/routes/category-routes"));
app.use("/api/products", require("./backend/routes/product-routes"));
app.use("/api/finances", require("./backend/routes/finance-routes"));
app.use("/api/orders", require("./backend/routes/order-routes"));

// Server start
const PORT = process.env.PORT || 3000;
require("./backend/database/db.js")(); 
app.listen(PORT, () => console.log("Server is running on port", PORT));