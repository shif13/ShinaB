
// ============================================
// FILE: src/middleware/validator.js
// ============================================
const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  validate
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Product validators
const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .isIn(['CLOTHING', 'ACCESSORIES', 'HOMEDECOR', 'FOOTWEAR'])
    .withMessage('Invalid category'),
  body('subcategory')
    .isIn(['MEN', 'WOMEN', 'KIDS', 'PETS', 'ALL'])
    .withMessage('Invalid subcategory'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  validate
];

const updateProductValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  validate
];

// Cart validators
const addToCartValidator = [
  body('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('size')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Size cannot be empty'),
  body('color')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Color cannot be empty'),
  validate
];

// Order validators
const createOrderValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('paymentMethod')
    .isIn(['CARD', 'UPI', 'NETBANKING', 'WALLET'])
    .withMessage('Invalid payment method'),
  validate
];

// Review validators
const createReviewValidator = [
  body('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
  validate
];

// Query validators
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

const idParamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  validate
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  createProductValidator,
  updateProductValidator,
  addToCartValidator,
  createOrderValidator,
  createReviewValidator,
  paginationValidator,
  idParamValidator
};