const ProductOffering = require('../../models/ProductOffering');

module.exports = async(req, res) =>{
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
  
      const [data, total] = await Promise.all([
        ProductOffering.find().skip(skip).limit(limit),
        ProductOffering.countDocuments()
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