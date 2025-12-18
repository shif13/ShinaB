const prisma = require('../config/database');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stock: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: true }
      });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity), 
      0
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        summary: {
          subtotal,
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, size, color } = req.body;

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id }
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        size,
        color
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          color
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: { cart: updatedCart }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/items/:itemId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId: req.user.id }
      },
      include: { product: true }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId: req.user.id }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};