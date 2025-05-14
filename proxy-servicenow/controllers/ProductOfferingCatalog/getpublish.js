const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');

module.exports = async (req, res) => {
    try {

        query = {
            $or: [
                { status: { $regex: `published`, $options: 'i' } }
            ]
        };


        const data = await Promise.all(ProductOfferingCatalog.find(query));

        res.send(data);
    } catch (err) {
        res.status(500).send(err);
    }
};