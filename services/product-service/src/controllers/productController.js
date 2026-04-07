import Product from '../models/Product.js';
import Category from '../models/Category.js';

// @desc Get all products with filters
// @route GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'featured'
    } = req.query;

    const query = { isActive: true };

    // Category filter
    if (category) query.category = category;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    const sortOptions = {
      featured: { ratings: -1, createdAt: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'name': { name: 1 },
      'rating': { 'ratings.average': -1 }
    };

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOptions[sort] || sortOptions.featured)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      current: Number(page),
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single product
// @route GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .lean();

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create product (Admin)
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id).populate('category');
    
    res.status(201).json({
      success: true,
      product: populated
    });
  } catch (error) {
    next(error);
  }
};
