const ProductOfferingCategory = require('../../models/ProductOfferingCategory');

module.exports = async (req, res) => {
  try {
    const limit = 20;
    const searchQuery = req.query.q;

    let query = { status: 'published' };

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query.name = { $regex: `.*${searchTerm}.*`, $options: 'i' };
    }

    const data = await ProductOfferingCategory
      .find(query)
      .sort({ createdAt: -1 }) 
      .limit(limit);

    res.send({ 
      data, 
    });
  } catch (err) {
    res.status(500).send(err);
  }
};