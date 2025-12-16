const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency = 'inr') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe payment intent creation failed: ${error.message}`);
  }
};

const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw new Error(`Stripe payment intent retrieval failed: ${error.message}`);
  }
};

const createRefund = async (paymentIntentId, amount) => {
  try {
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
  } catch (error) {
    throw new Error(`Stripe refund failed: ${error.message}`);
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund
};
