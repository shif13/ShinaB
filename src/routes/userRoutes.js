// ============================================
// FILE: src/routes/userRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { idParamValidator } = require('../middleware/validator');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Addresses
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, idParamValidator, updateAddress);
router.delete('/addresses/:id', protect, idParamValidator, deleteAddress);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, idParamValidator, addToWishlist);
router.delete('/wishlist/:productId', protect, idParamValidator, removeFromWishlist);

module.exports = router;

