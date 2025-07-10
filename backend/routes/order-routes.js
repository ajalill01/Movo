const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/order-controller');
const authMiddleware = require('../middleware/auth-middleware');

router.post('/', createOrder);
router.get('/', authMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderDetails);
router.patch('/:id/change', authMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, deleteOrder);

module.exports = router;