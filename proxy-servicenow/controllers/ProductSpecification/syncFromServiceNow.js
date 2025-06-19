const ProductSpecification = require('../../models/productSpecification');
const externalIdHelper = require('../../utils/externalIdHelper');
const snConnection = require('../../utils/servicenowConnection'); 

/**
 * Sync product specification from ServiceNow
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const syncFromServiceNow = async (req, res) => {
  try {
    const specData = req.body;

    if (!specData.id && !specData.sys_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: sys_id'
      });
    }

    console.log(`Received product specification from ServiceNow: ${specData.display_name}`);

    // 1. Upsert MongoDB
    const result = await ProductSpecification.updateOne(
      { sys_id: specData.sys_id },
      { $set: { ...specData.tmf_data, specification_type: specData.specification_type } },
      { upsert: true }
    );

    console.log(`Product specification synchronized: ${specData.tmf_data.display_name}`);

    // 2. PATCH externalId to ServiceNow if created (new upsert)
    if (result.upsertedId) {
      const connection = snConnection.getConnection(req.user?.sn_access_token); // Assure toi que token existe
      const mongoId = result._id.toString();
      const path = `/api/now/table/sn_prd_pm_product_specification/${specData.sys_id}`;
      console.log(mongoId)
      await externalIdHelper(connection, path, mongoId);
      console.log(`✅ externalId (${mongoId}) patched to ServiceNow`);
    }

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
    console.error("❌ Error synchronizing product specification:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = syncFromServiceNow;
