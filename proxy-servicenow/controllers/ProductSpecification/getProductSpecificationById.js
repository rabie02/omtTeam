const ProductSpecification = require('../../models/productSpecification');

const getProductSpecificationById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Using MongoDB ObjectId (_id field)
    const productSpec = await ProductSpecification.findById(id).lean();
    
    if (!productSpec) {  // Fixed: Changed from 'if (productSpec)' to 'if (!productSpec)'
      return res.status(404).json({
        success: false,
        message: `Product specification not found`
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

module.exports = getProductSpecificationById;