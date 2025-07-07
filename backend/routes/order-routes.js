const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const {
  createOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  deleteOrder,
  deleteAllOrders
} = require('../controllers/order-controller');


router.post('/', createOrder);

router.get('/', authMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderDetails);
router.patch('/:id', authMiddleware, updateOrderStatus);
router.delete('/:id', authMiddleware, deleteOrder);
router.delete('/', authMiddleware, deleteAllOrders);

module.exports = router;