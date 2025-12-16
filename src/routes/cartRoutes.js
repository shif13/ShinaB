const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { addToCartValidator, idParamValidator } = require('../middleware/validator');

router.get('/', protect, getCart);
router.post('/add', protect, addToCartValidator, addToCart);
router.put('/items/:itemId', protect, updateCartItem);
router.delete('/items/:itemId', protect, idParamValidator, removeFromCart);
router.delete('/clear', protect, clearCart);

module.exports = router;