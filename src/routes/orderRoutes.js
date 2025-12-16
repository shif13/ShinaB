const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { createOrderValidator, idParamValidator } = require('../middleware/validator');

router.post('/', protect, createOrderValidator, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, idParamValidator, getOrder);
router.put('/:id/cancel', protect, idParamValidator, cancelOrder);

module.exports = router;

