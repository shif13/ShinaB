// ============================================
// FILE: src/controllers/userController.js
// ============================================
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        phone
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true }
    });

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for OAuth users'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all addresses
// @route   GET /api/users/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: { addresses }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const { firstName, lastName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        firstName,
        lastName,
        street,
        city,
        state,
        zipCode,
        country: country || 'India',
        phone,
        isDefault: isDefault || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: req.user.id,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        firstName,
        lastName,
        street,
        city,
        state,
        zipCode,
        country,
        phone,
        isDefault
      }
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if address belongs to user
    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await prisma.address.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                images: true,
                stock: true,
                category: true,
                subcategory: true,
                slug: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: { wishlist }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: req.user.id }
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Added to wishlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.id }
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    await prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};