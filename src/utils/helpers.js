const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SHN-${timestamp}-${random}`;
};

const generateSKU = (category, subcategory) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const catCode = category.substring(0, 3).toUpperCase();
  const subCode = subcategory.substring(0, 3).toUpperCase();
  return `${catCode}-${subCode}-${timestamp}`;
};

const calculateOrderTotal = (items, shippingCost = 0, tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost + tax - discount;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

module.exports = {
  generateOrderNumber,
  generateSKU,
  calculateOrderTotal,
  slugify
};
