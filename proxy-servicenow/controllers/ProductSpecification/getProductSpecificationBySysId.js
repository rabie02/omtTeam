const ProductSpecification = require('../../models/productSpecification');

/**
 * Get product specification by sys_id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProductSpecificationBySysId = async (req, res) => {
  try {
    const { sysId } = req.params;
    const productSpec = await ProductSpecification.findOne({ sys_id: sysId });
    
    if (!productSpec) {
      return res.status(404).json({
        success: false,
        message: `Product specification with sys_id ${sysId} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: productSpec
    });
  } catch (error) {
    console.error("Error fetching product specification:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = getProductSpecificationBySysId;