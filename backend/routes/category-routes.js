const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category-controller');

const router = express.Router();


router.get('/', getAllCategories);
router.get('/:id', getCategory);

router.post('/', authMiddleware, createCategory);
router.patch('/:id', authMiddleware, updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

module.exports = router;