const prisma = require('../config/database');
const { slugify, generateSKU } = require('../utils/helpers');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      subcategory, 
      minPrice, 
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
      featured
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true
    };

    if (category) where.category = category.toUpperCase();
    if (subcategory) where.subcategory = subcategory.toUpperCase();
    if (featured === 'true') where.featured = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          price: true,
          compareAtPrice: true,
          images: true,
          sizes: true,
          colors: true,
          stock: true,
          featured: true,
          ratingAverage: true,
          ratingCount: true,
          slug: true,
          tags: true,
          createdAt: true
        }
      }),
      prisma.product.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { rating, title, comment } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: req.user.id
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating,
        title,
        comment
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true }
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: avgRating,
        ratingCount: reviews.length
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  createReview
};