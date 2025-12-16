const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const { createProductValidator, updateProductValidator, idParamValidator, paginationValidator } = require('../middleware/validator');

// Apply admin auth to all routes
router.use(protect);
router.use(adminAuth);

// Dashboard
router.get('/stats', getDashboardStats);

// Products
router.post('/products', uploadMultiple, handleUploadError, createProductValidator, createProduct);
router.put('/products/:id', uploadMultiple, handleUploadError, updateProductValidator, updateProduct);
router.delete('/products/:id', idParamValidator, deleteProduct);

// Orders
router.get('/orders', paginationValidator, getAllOrders);
router.put('/orders/:id/status', idParamValidator, updateOrderStatus);

// Users
router.get('/users', paginationValidator, getAllUsers);
router.put('/users/:id/role', idParamValidator, updateUserRole);

module.exports = router;