// ============================================
// FILE: src/controllers/adminController.js
// ============================================
const prisma = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { slugify, generateSKU } = require('../utils/helpers');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      revenue
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true }
      })
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 10 }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        stock: true,
        sku: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          pendingOrders,
          totalRevenue: revenue._sum.total || 0
        },
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      compareAtPrice,
      sizes,
      colors,
      stock,
      featured,
      tags
    } = req.body;

    // Generate slug and SKU
    const slug = slugify(name);
    const sku = generateSKU(category, subcategory);

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer.toString('base64'),
          'shina-boutique/products'
        );
        imageUrls.push(result.url);
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category: category.toUpperCase(),
        subcategory: subcategory.toUpperCase(),
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        images: imageUrls,
        sizes: sizes || [],
        colors: colors || [],
        stock: parseInt(stock),
        sku,
        slug,
        featured: featured === 'true',
        tags: tags || []
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer.toString('base64'),
          'shina-boutique/products'
        );
        newImageUrls.push(result.url);
      }
      updateData.images = [...existingProduct.images, ...newImageUrls];
    }

    // Update slug if name changed
    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
    }

    // Convert strings to proper types
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.compareAtPrice) updateData.compareAtPrice = parseFloat(updateData.compareAtPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.featured) updateData.featured = updateData.featured === 'true';

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    // Note: Extract public_id from URLs if needed

    await prisma.product.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.orderStatus = status.toUpperCase();

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const updateData = { orderStatus: orderStatus.toUpperCase() };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (orderStatus.toUpperCase() === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }

    if (orderStatus.toUpperCase() === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User role updated',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole
};
