const ProductOffering = require('../../models/ProductOffering');

module.exports = async (req, res) => {
  try {
    const productOffering = await ProductOffering.findOne({ _id: req.params.id })
      .populate('category')
      .populate('productSpecification')
      .exec();

    if (!productOffering) {
      return res.status(404).json({ 
        success: false,
        message: 'Product Offering not found' 
      });
    }

    res.json({
      success: true,
      data: productOffering
    });
  } catch (err) {
    console.error('Error fetching product offering:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching product offering',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};