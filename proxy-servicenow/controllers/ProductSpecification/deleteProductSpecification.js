const handleMongoError = require('../../utils/handleMongoError');
const snConnection = require('../../utils/servicenowConnection');
const axios = require('axios');
const ProductSpecification = require('../../models/productSpecification');

async function deleteProductSpecification(req, res = null) {
  try {
    const sysId = req.params.id || req.id;

    if (!sysId) {
      return res.status(400).json({
        success: false,
        message: 'Missing sys_id in request'
      });
    }

    // Trouver la spec dans MongoDB via sys_id
    const productSpec = await ProductSpecification.findOne({ sys_id: sysId });
    if (!productSpec) {
      return res.status(404).json({
        success: false,
        message: `Product specification with sys_id ${sysId} not found in MongoDB`
      });
    }

    let snResponseData = null;

    // Supprimer depuis ServiceNow si token disponible
    if (req.user && req.user.sn_access_token) {
      try {
        const connection = snConnection.getConnection(req.user.sn_access_token);
        const snResponse = await axios.delete(
          `${connection.baseURL}/api/now/table/sn_prd_pm_product_specification/${sysId}`,
          { headers: connection.headers }
        );
        snResponseData = snResponse.data;
      } catch (snError) {
        console.warn('⚠️ Erreur suppression ServiceNow ignorée :', snError.message);
      }
    } else {
      console.warn('⚠️ sn_access_token manquant — suppression ServiceNow ignorée');
    }

    // Supprimer dans MongoDB via sys_id
    try {
      await ProductSpecification.deleteOne({ sys_id: sysId });
    } catch (mongoError) {
      return handleMongoError(res, snResponseData, mongoError, 'delete');
    }

    res.json({
      success: true,
      message: 'Product specification successfully deleted',
      mongoSysId: sysId,
      servicenowResponse: snResponseData
    });

  } catch (error) {
    console.error('❌ ERROR in deleteProductSpecification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = deleteProductSpecification;
module.exports.deleteProductSpecification = deleteProductSpecification;
