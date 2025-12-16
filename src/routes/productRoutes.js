const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductBySlug,
  createReview
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { paginationValidator, idParamValidator, createReviewValidator } = require('../middleware/validator');

router.get('/', paginationValidator, getProducts);
router.get('/:id', idParamValidator, getProduct);
router.get('/slug/:slug', getProductBySlug);
router.post('/:id/reviews', protect, createReviewValidator, createReview);

module.exports = router;