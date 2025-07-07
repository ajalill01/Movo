const express = require('express');
const { getFinancialStats } = require('../controllers/finance-controller');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();


router.get('/', authMiddleware,getFinancialStats);

module.exports = router;