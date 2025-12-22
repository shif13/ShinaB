// ============================================
// FILE: backend/src/routes/userRoutes.js - FIXED
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
const { param } = require('express-validator');
const { validate } = require('../middleware/validator');

// Create a custom product ID validator
const productIdValidator = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID format'),
  validate
];

// Address ID validator
const addressIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid address ID format'),
  validate
];

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Address routes
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, addressIdValidator, updateAddress);
router.delete('/addresses/:id', protect, addressIdValidator, deleteAddress);

// Wishlist routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, productIdValidator, addToWishlist);
router.delete('/wishlist/:productId', protect, productIdValidator, removeFromWishlist);

module.exports = router;