const ProductSpecification = require('../../models/productSpecification');

/**
 * Sync product specification from ServiceNow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const syncFromServiceNow = async (req, res) => {
  try {
    const specData = req.body;
    
    // Validate required fields
    if (!specData.sys_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: sys_id' 
      });
    }
    
    // Log incoming data
    console.log(`Received product specification from ServiceNow: ${specData.display_name}`);
    
    // Update or insert the product specification
    const result = await ProductSpecification.updateOne(
      { sys_id: specData.sys_id },
      { $set: { ...specData.tmf_data, specification_type: specData.specification_type} },
      { upsert: true }
    );
    
    console.log(`Product specification synchronized: ${specData.tmf_data.display_name}`);
    
    res.status(200).json({ 
      success: true, 
      message: "Product specification synchronized successfully",
      data: {
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedId ? 1 : 0,
        upsertedId: result.upsertedId
      }
    });
  } catch (error) {
    console.error("Error synchronizing product specification:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = syncFromServiceNow;
