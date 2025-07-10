const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const uploadMiddleware = require('../middleware/upload-middleware');
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product-controller');

const router = express.Router();

router.get('/getallproduct', getAllProducts);
router.get('/:id', getProduct);


router.post(
  '/',
  authMiddleware,
  uploadMiddleware.single('image'),
  createProduct
);
router.patch(
  '/:id',
  authMiddleware,
  uploadMiddleware.single('image'),
  updateProduct
);
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;