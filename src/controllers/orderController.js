const prisma = require('../config/database');
const { generateOrderNumber } = require('../utils/helpers');
const { sendOrderConfirmation } = require('../utils/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: product.images[0]
      });

      subtotal += product.price * item.quantity;
    }

    const shippingCost = subtotal >= 1000 ? 0 : 50;
    const tax = subtotal * 0.18;
    const total = subtotal + shippingCost + tax;

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        orderNumber,
        shippingAddress,
        paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        subtotal,
        shippingCost,
        tax,
        total,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id }
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    sendOrderConfirmation(user, order).catch(err => console.error('Email failed:', err));

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder
};