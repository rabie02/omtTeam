const ProductSpecification = require('../../models/productSpecification');

const deleteProductSpecification = async (req, res) => {
  // Logs détaillés pour le débogage
  console.log('=== DELETE REQUEST RECEIVED ===');
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);
  console.log('Request IP:', req.ip);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { sysId } = req.params;
    console.log(`Attempting to delete product specification with sys_id: ${sysId}`);
    
    // Vérifier si la spécification existe
    const productSpec = await ProductSpecification.findOne({ sys_id: sysId });
    
    if (!productSpec) {
      console.log(`Product specification with sys_id ${sysId} not found`);
      return res.status(404).json({
        success: false,
        message: `Product specification with sys_id ${sysId} not found`
      });
    }
    
    console.log(`Found product specification: ${productSpec.display_name}`);
    
    // Supprimer la spécification
    const result = await ProductSpecification.deleteOne({ sys_id: sysId });
    console.log('Delete operation result:', result);
    
    console.log(`Successfully deleted product specification: ${productSpec.display_name}`);
    
    res.status(200).json({
      success: true,
      message: `Product specification with sys_id ${sysId} successfully deleted`
    });
  } catch (error) {
    console.error('ERROR in deleteProductSpecification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = deleteProductSpecification;