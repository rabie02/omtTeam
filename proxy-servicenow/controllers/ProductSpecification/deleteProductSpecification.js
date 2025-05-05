// controllers/ProductSpecification/deleteProductSpecification.js
const ProductSpecification = require('../../models/productSpecification');

/**
 * Supprimer une spécification de produit par sys_id
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 */
const deleteProductSpecification = async (req, res) => {
  try {
    const { sysId } = req.params;
    
    // Vérifier si la spécification existe
    const productSpec = await ProductSpecification.findOne({ sys_id: sysId });
    
    if (!productSpec) {
      return res.status(404).json({
        success: false,
        message: `Spécification de produit avec sys_id ${sysId} non trouvée`
      });
    }
    
    // Supprimer la spécification
    await ProductSpecification.deleteOne({ sys_id: sysId });
    
    res.status(200).json({
      success: true,
      message: `Spécification de produit avec sys_id ${sysId} supprimée avec succès`
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la spécification:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = deleteProductSpecification;