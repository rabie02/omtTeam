const Quote = require('../../models/Quote');

/**
 * Sync quote from ServiceNow
 */
const syncQuoteFromServiceNow = async (req, res) => {
  try {
    const quoteData = req.body;

    if (!quoteData.sys_id) {
      return res.status(400).json({ success: false, message: "Missing sys_id" });
    }

    console.log("📥 Received quote:", quoteData.number);

    const result = await Quote.updateOne(
      { sys_id: quoteData.sys_id },
      { $set: quoteData },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Quote synchronized successfully",
      data: {
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedId ? 1 : 0,
        upsertedId: result.upsertedId
      }
    });
  } catch (error) {
    console.error("❌ Error syncing quote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = syncQuoteFromServiceNow;
