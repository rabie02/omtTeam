// controllers/ProductSpecification/updateProductSpecification.js
const ProductSpecification = require('../../models/productSpecification');

/**
 * Mettre à jour une spécification de produit par sys_id
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 */
const updateProductSpecification = async (req, res) => {
  try {
    const { sysId } = req.params;
    const updateData = req.body;
    
    // Vérifier si la spécification existe
    const productSpec = await ProductSpecification.findOne({ sys_id: sysId });
    
    if (!productSpec) {
      return res.status(404).json({
        success: false,
        message: `Spécification de produit avec sys_id ${sysId} non trouvée`
      });
    }
    
    // Empêcher la modification du sys_id
    if (updateData.sys_id && updateData.sys_id !== sysId) {
      return res.status(400).json({
        success: false,
        message: "La modification du sys_id n'est pas autorisée"
      });
    }
    
    // Mettre à jour la spécification
    const result = await ProductSpecification.updateOne(
      { sys_id: sysId },
      { $set: updateData }
    );
    
    res.status(200).json({
      success: true,
      message: `Spécification de produit mise à jour avec succès`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la spécification:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = updateProductSpecification;