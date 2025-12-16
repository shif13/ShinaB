// ============================================
// FILE: src/controllers/paymentController.js
// ============================================
const { createPaymentIntent, retrievePaymentIntent, stripe } = require('../config/stripe');
const prisma = require('../config/database');

// @desc    Create payment intent
// @route   POST /api/payment/create-intent
// @access  Private
const createIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Get order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(order.total);

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentId: paymentIntent.id }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          paidAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: { order }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhooks
// @route   POST /api/payment/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Find order and update
      const order = await prisma.order.findFirst({
        where: { stripePaymentId: paymentIntent.id }
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            paidAt: new Date()
          }
        });
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      const failedOrder = await prisma.order.findFirst({
        where: { stripePaymentId: failedPayment.id }
      });

      if (failedOrder) {
        await prisma.order.update({
          where: { id: failedOrder.id },
          data: { paymentStatus: 'FAILED' }
        });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createIntent,
  verifyPayment,
  handleWebhook
};