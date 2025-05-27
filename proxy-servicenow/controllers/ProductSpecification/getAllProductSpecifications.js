const ProductSpecification = require('../../models/productSpecification');

/**
 * Get all product specifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllProductSpecifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    let query = {};
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = {
        $or: [
          { display_name: { $regex: `.*${searchTerm}.*`, $options: 'i' } },
          { specification_type: { $regex: `.*${searchTerm}.*`, $options: 'i' } },
        ]
      };
    }

    const [data, total] = await Promise.all([
      ProductSpecification.find(query).skip(skip).limit(limit),
      ProductSpecification.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data
    });
  } catch (error) {
    console.error("Error fetching product specifications:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = getAllProductSpecifications;