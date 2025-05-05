const ProductSpecification = require('../../models/productSpecification');

/**
 * Get all product specifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllProductSpecifications = async (req, res) => {
  try {
    const productSpecs = await ProductSpecification.find({});
    res.status(200).json({
      success: true,
      count: productSpecs.length,
      data: productSpecs
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