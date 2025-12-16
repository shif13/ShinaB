const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Shina Boutique" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>Welcome to Shina Boutique!</h1>
    <p>Hi ${user.firstName},</p>
    <p>Thank you for joining Shina Boutique. We're excited to have you!</p>
    <p>Start shopping our latest collection now.</p>
    <a href="${process.env.CLIENT_URL}">Visit Store</a>
  `;
  
  await sendEmail(user.email, 'Welcome to Shina Boutique', html);
};

const sendOrderConfirmation = async (user, order) => {
  const html = `
    <h1>Order Confirmation</h1>
    <p>Hi ${user.firstName},</p>
    <p>Your order #${order.orderNumber} has been confirmed!</p>
    <p>Total: ₹${order.total}</p>
    <p>We'll send you another email when your order ships.</p>
    <a href="${process.env.CLIENT_URL}/orders/${order.id}">View Order</a>
  `;
  
  await sendEmail(user.email, `Order Confirmation - ${order.orderNumber}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation
};
