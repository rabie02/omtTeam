// middleware/validateProductSpec.js
const validateProductSpecUpdate = (req, res, next) => {
    const { display_name, specification_category, specification_type } = req.body;
    
    // Vérifier les champs obligatoires pour la mise à jour
    if (req.body.sys_id) {
      return res.status(400).json({
        success: false,
        message: "La modification du sys_id n'est pas autorisée"
      });
    }
    
    // Vérifier que les champs ont des valeurs valides
    if (display_name && typeof display_name !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Le champ display_name doit être une chaîne de caractères"
      });
    }
    
    // Continuer vers le contrôleur si tout est valide
    next();
  };
  
  module.exports = {
    validateProductSpecUpdate
  };