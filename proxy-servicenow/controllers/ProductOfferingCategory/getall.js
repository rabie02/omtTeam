const express = require('express');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');

const router = express.Router();

// GET ALL (with pagination and search)
router.get('/product-offering-category', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // Ajout de la condition de recherche
    let query = {};
    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { code: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { number: { $regex: searchTerm, $options: 'i' } }  // Ajout de la recherche sur le numéro
        ]
      };
    }

    // Si nous voulons ajouter un tri basé sur la pertinence de recherche
    let sortOptions = {};

    if (searchTerm) {
      // Utilisation d'une pipeline d'agrégation pour le tri par pertinence
      const aggregationPipeline = [
        { $match: query },
        { 
          $addFields: {
            searchRelevance: {
              $cond: {
                if: { $regexMatch: { input: "$name", regex: searchTerm, options: "i" } },
                then: 3,  // Priorité élevée si le nom correspond
                else: {
                  $cond: {
                    if: { $regexMatch: { input: "$code", regex: searchTerm, options: "i" } },
                    then: 2,  // Priorité moyenne si le code correspond
                    else: 1   // Priorité basse pour les autres correspondances
                  }
                }
              }
            }
          }
        },
        { $sort: { searchRelevance: -1, name: 1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      // Exécuter l'agrégation pour les résultats de recherche avec tri par pertinence
      const data = await ProductOfferingCategory.aggregate(aggregationPipeline);
      const total = await ProductOfferingCategory.countDocuments(query);

      const dataWithImages = data.map(item => ({
        ...item,
        image: item.image ? `${req.protocol}://${req.get('host')}/images/category/${item.image}` : '',
        thumbnail: item.thumbnail ? `${req.protocol}://${req.get('host')}/images/category/${item.thumbnail}` : ''
      }));

      return res.send({
        data: dataWithImages,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    // Requête standard sans tri par pertinence
    const [data, total] = await Promise.all([
      ProductOfferingCategory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProductOfferingCategory.countDocuments(query)
    ]);

    const dataWithImages = data.map(item => ({
      ...item.toObject(),
      image: item.image ? `${req.protocol}://${req.get('host')}/images/category/${item.image}` : '',
      thumbnail: item.thumbnail ? `${req.protocol}://${req.get('host')}/images/category/${item.thumbnail}` : ''
    }));

    res.send({
      data: dataWithImages,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error in getall controller:', err);
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;