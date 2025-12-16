// ============================================
// FILE: prisma/seed.js
// ============================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shinaboutique.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+919876543210',
      role: 'ADMIN',
      emailVerified: true
    }
  });

  // Create Test Customer
  console.log('👤 Creating test customer...');
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  
  const customer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543211',
      role: 'CUSTOMER',
      emailVerified: true,
      addresses: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main Street',
          city: 'Chennai',
          state: 'Tamil Nadu',
          zipCode: '600001',
          country: 'India',
          phone: '+919876543211',
          isDefault: true
        }
      }
    }
  });

  // Create Cart and Wishlist for customer
  await prisma.cart.create({
    data: { userId: customer.id }
  });

  await prisma.wishlist.create({
    data: { userId: customer.id }
  });

  // Create Products
  console.log('🛍️  Creating products...');

  const products = [
    // Women's Clothing
    {
      name: 'Elegant Silk Saree',
      description: 'Beautiful handwoven silk saree with intricate embroidery. Perfect for special occasions and traditional events.',
      category: 'CLOTHING',
      subcategory: 'WOMEN',
      price: 8999,
      compareAtPrice: 12999,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
      sizes: ['Free Size'],
      colors: ['Red', 'Blue', 'Green', 'Gold'],
      stock: 25,
      sku: 'CLO-WOM-SAREE001',
      slug: 'elegant-silk-saree',
      featured: true,
      tags: ['saree', 'silk', 'traditional', 'ethnic']
    },
    {
      name: 'Cotton Kurti Set',
      description: 'Comfortable cotton kurti with palazzo pants. Ideal for daily wear and casual outings.',
      category: 'CLOTHING',
      subcategory: 'WOMEN',
      price: 1499,
      compareAtPrice: 1999,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Pink', 'Yellow', 'Blue'],
      stock: 50,
      sku: 'CLO-WOM-KURTI001',
      slug: 'cotton-kurti-set',
      featured: true,
      tags: ['kurti', 'cotton', 'casual', 'ethnic']
    },

    // Men's Clothing
    {
      name: 'Classic Linen Shirt',
      description: 'Premium linen shirt for men. Breathable and comfortable, perfect for summer.',
      category: 'CLOTHING',
      subcategory: 'MEN',
      price: 1899,
      compareAtPrice: 2499,
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Blue', 'Beige', 'Grey'],
      stock: 40,
      sku: 'CLO-MEN-SHIRT001',
      slug: 'classic-linen-shirt',
      featured: false,
      tags: ['shirt', 'linen', 'casual', 'summer']
    },
    {
      name: 'Formal Blazer',
      description: 'Tailored blazer for formal occasions. Made with premium fabric and excellent fit.',
      category: 'CLOTHING',
      subcategory: 'MEN',
      price: 4999,
      compareAtPrice: 6999,
      images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Navy Blue', 'Grey'],
      stock: 20,
      sku: 'CLO-MEN-BLAZ001',
      slug: 'formal-blazer',
      featured: true,
      tags: ['blazer', 'formal', 'office', 'business']
    },

    // Kids Clothing
    {
      name: 'Kids Cotton T-Shirt Pack',
      description: 'Pack of 3 comfortable cotton t-shirts for kids. Soft fabric, vibrant colors.',
      category: 'CLOTHING',
      subcategory: 'KIDS',
      price: 899,
      compareAtPrice: 1299,
      images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800'],
      sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
      colors: ['Multicolor'],
      stock: 60,
      sku: 'CLO-KID-TSHI001',
      slug: 'kids-cotton-tshirt-pack',
      featured: false,
      tags: ['kids', 't-shirt', 'cotton', 'casual']
    },

    // Footwear
    {
      name: 'Women Ethnic Juttis',
      description: 'Handcrafted traditional juttis with beautiful embroidery work.',
      category: 'FOOTWEAR',
      subcategory: 'WOMEN',
      price: 1299,
      compareAtPrice: 1799,
      images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
      sizes: ['5', '6', '7', '8', '9'],
      colors: ['Gold', 'Silver', 'Red', 'Green'],
      stock: 35,
      sku: 'FOO-WOM-JUTT001',
      slug: 'women-ethnic-juttis',
      featured: true,
      tags: ['juttis', 'ethnic', 'traditional', 'footwear']
    },
    {
      name: 'Men Leather Formal Shoes',
      description: 'Premium leather formal shoes. Perfect for office and formal events.',
      category: 'FOOTWEAR',
      subcategory: 'MEN',
      price: 3499,
      compareAtPrice: 4999,
      images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800'],
      sizes: ['7', '8', '9', '10', '11'],
      colors: ['Black', 'Brown', 'Tan'],
      stock: 30,
      sku: 'FOO-MEN-FORM001',
      slug: 'men-leather-formal-shoes',
      featured: false,
      tags: ['shoes', 'leather', 'formal', 'office']
    },

    // Accessories
    {
      name: 'Designer Handbag',
      description: 'Elegant designer handbag with multiple compartments. Perfect for daily use.',
      category: 'ACCESSORIES',
      subcategory: 'WOMEN',
      price: 2499,
      compareAtPrice: 3499,
      images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      sizes: ['One Size'],
      colors: ['Black', 'Brown', 'Beige', 'Pink'],
      stock: 25,
      sku: 'ACC-WOM-HANG001',
      slug: 'designer-handbag',
      featured: true,
      tags: ['handbag', 'bag', 'accessory', 'fashion']
    },
    {
      name: 'Premium Leather Belt',
      description: 'Genuine leather belt for men. Durable and stylish.',
      category: 'ACCESSORIES',
      subcategory: 'MEN',
      price: 799,
      compareAtPrice: 1199,
      images: ['https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800'],
      sizes: ['32', '34', '36', '38', '40'],
      colors: ['Black', 'Brown'],
      stock: 45,
      sku: 'ACC-MEN-BELT001',
      slug: 'premium-leather-belt',
      featured: false,
      tags: ['belt', 'leather', 'accessory', 'men']
    },

    // Home Decor
    {
      name: 'Ceramic Vase Set',
      description: 'Set of 3 handcrafted ceramic vases. Beautiful home decor piece.',
      category: 'HOMEDECOR',
      subcategory: 'ALL',
      price: 1599,
      compareAtPrice: 2299,
      images: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800'],
      sizes: ['One Size'],
      colors: ['White', 'Blue', 'Multicolor'],
      stock: 20,
      sku: 'HOM-ALL-VASE001',
      slug: 'ceramic-vase-set',
      featured: true,
      tags: ['vase', 'ceramic', 'decor', 'home']
    },
    {
      name: 'Cotton Cushion Covers',
      description: 'Set of 5 premium cotton cushion covers with beautiful prints.',
      category: 'HOMEDECOR',
      subcategory: 'ALL',
      price: 999,
      compareAtPrice: 1499,
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
      sizes: ['16x16', '18x18'],
      colors: ['Multicolor'],
      stock: 40,
      sku: 'HOM-ALL-CUSH001',
      slug: 'cotton-cushion-covers',
      featured: false,
      tags: ['cushion', 'covers', 'cotton', 'decor']
    },

    // Pet Accessories
    {
      name: 'Pet Collar with Leash',
      description: 'Comfortable and durable pet collar with matching leash. Adjustable size.',
      category: 'ACCESSORIES',
      subcategory: 'PETS',
      price: 499,
      compareAtPrice: 699,
      images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'],
      sizes: ['S', 'M', 'L'],
      colors: ['Red', 'Blue', 'Black', 'Pink'],
      stock: 50,
      sku: 'ACC-PET-COLL001',
      slug: 'pet-collar-with-leash',
      featured: false,
      tags: ['pet', 'collar', 'leash', 'dog']
    }
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users created: 2 (1 admin, 1 customer)`);
  console.log(`   - Products created: ${products.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@shinaboutique.com');
  console.log('     Password: Admin@123');
  console.log('   Customer:');
  console.log('     Email: customer@test.com');
  console.log('     Password: Customer@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });