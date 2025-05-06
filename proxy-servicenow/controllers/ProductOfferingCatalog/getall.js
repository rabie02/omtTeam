const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');

module.exports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;

    let query = {};
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = {
        $or: [
          { name: { $regex: `.*${searchQuery}.*`, $options: 'i' } },
          { status: { $regex: `${searchTerm}`, $options: 'i' } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      ProductOfferingCatalog.find(query).skip(skip).limit(limit),
      ProductOfferingCatalog.countDocuments(query)
    ]);

    res.send({ 
      data, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (err) {
    res.status(500).send(err);
  }
};