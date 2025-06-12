const handleMongoError = require('../../utils/handleMongoError');
const snConnection = require('../../utils/servicenowConnection');
const axios = require('axios');
const ProductSpecification = require('../../models/productSpecification');


async function deleteProductSpecification (req, res =null) { 
  try {

    const mongoId = req.params.id || req.id;
    
    // Vérifier si la spécification existe
    const productSpec = await ProductSpecification.findById(mongoId);
    if (!productSpec) {
      return res.status(404).json({
        success: false,
        message: `Product specification not found`
      });
    }
    const sysId = productSpec.sys_id; 

    if(!sysId){
      return res.status(400).json({
        error: " miss sys_id"
      });
    }

    // delete spec from servicenow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.delete(
      `${connection.baseURL}/api/now/table/sn_prd_pm_product_specification/${sysId}`, 
      { headers: connection.headers }
    );

    //delete mongodb
    try{
      await ProductSpecification.findByIdAndDelete(mongoId);
    }catch(mongoError){
        return handleMongoError(res, snResponse.data , mongoError , "delete");
    }

    res.json({
      message: 'product spe successfully deleted from both MongoDB and ServiceNow',
          mongoId: mongoId,
          servicenowId: sysId,
          servicenowResponse: snResponse.data
    })


  } catch (error) {
    console.error('ERROR in deleteProductSpecification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = deleteProductSpecification;
module.exports.deleteProductSpecification = deleteProductSpecification;