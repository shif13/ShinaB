// ============================================
// FILE: src/controllers/paymentController.js - FINAL WORKING VERSION
// ============================================
const { stripe } = require('../config/stripe');
const prisma = require('../config/database');

// @desc    Create payment intent
// @route   POST /api/payment/create-intent
// @access  Private
const createIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    console.log('📝 Creating payment intent for order:', orderId);
    console.log('👤 User:', req.user.id);

    // Get order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      }
    });

    if (!order) {
      console.log('❌ Order not found:', orderId);
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

    console.log('💰 Order total:', order.total, 'INR');

    // Create payment intent with automatic payment methods
    // This will use whatever payment methods you have enabled in Stripe Dashboard
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to paise (smallest unit)
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true, // Automatically uses enabled payment methods
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: req.user.id
      },
      description: `Shina Boutique - Order ${order.orderNumber}`,
      receipt_email: req.user.email || undefined
    });

    console.log('✅ Payment intent created:', paymentIntent.id);
    console.log('🎯 Client secret generated');

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        stripePaymentId: paymentIntent.id,
        paymentStatus: 'PENDING'
      }
    });

    console.log('💾 Order updated with payment intent');

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('❌ Create payment intent error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    console.log('🔍 Verifying payment:', paymentIntentId);
    console.log('📦 For order:', orderId);

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and order ID are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('📊 Payment status:', paymentIntent.status);

    // Check if payment was successful
    if (paymentIntent.status === 'succeeded') {
      // Update order
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          paidAt: new Date()
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Order updated to PAID:', order.orderNumber);
      console.log('🎉 Payment successful!');

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: { order }
      });
    } else if (paymentIntent.status === 'processing') {
      console.log('⏳ Payment is processing');
      res.status(200).json({
        success: true,
        message: 'Payment is being processed',
        data: {
          status: 'processing'
        }
      });
    } else if (paymentIntent.status === 'requires_action') {
      console.log('🔐 Payment requires additional action');
      res.status(200).json({
        success: true,
        message: 'Payment requires additional action',
        data: {
          status: 'requires_action'
        }
      });
    } else {
      console.log('❌ Payment failed with status:', paymentIntent.status);
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📨 Webhook event received:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded via webhook:', paymentIntent.id);
        
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
          console.log('✅ Order updated via webhook:', order.orderNumber);
        } else {
          console.log('⚠️ Order not found for payment intent:', paymentIntent.id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed via webhook:', failedPayment.id);
        console.log('Failure reason:', failedPayment.last_payment_error?.message);
        
        const failedOrder = await prisma.order.findFirst({
          where: { stripePaymentId: failedPayment.id }
        });

        if (failedOrder) {
          await prisma.order.update({
            where: { id: failedOrder.id },
            data: { paymentStatus: 'FAILED' }
          });
          console.log('✅ Order marked as failed:', failedOrder.orderNumber);
        }
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        console.log('🚫 Payment canceled via webhook:', canceledPayment.id);
        break;

      case 'payment_intent.processing':
        const processingPayment = event.data.object;
        console.log('⏳ Payment processing via webhook:', processingPayment.id);
        break;

      case 'payment_intent.created':
        console.log('📝 Payment intent created via webhook');
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${event.type}`);
    }
  } catch (webhookError) {
    console.error('❌ Error processing webhook:', webhookError);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
};

module.exports = {
  createIntent,
  verifyPayment,
  handleWebhook
};