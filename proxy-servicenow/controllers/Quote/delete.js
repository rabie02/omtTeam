const Quote = require('../../models/quote');

const deleteQuote = async (req, res) => {
  console.log('=== DELETE QUOTE REQUEST RECEIVED ===');
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);
  console.log('Request IP:', req.ip);
  console.log('Timestamp:', new Date().toISOString());

  try {
    const { sysId } = req.params;
    console.log(`Attempting to delete quote with sys_id: ${sysId}`);
    
    // Check if the quote exists
    const quote = await Quote.findOne({ sys_id: sysId });

    if (!quote) {
      console.log(`Quote with sys_id ${sysId} not found`);
      return res.status(404).json({
        success: false,
        message: `Quote with sys_id ${sysId} not found`
      });
    }

    console.log(`Found quote: ${quote.name || quote.display_name || quote._id}`);

    // Delete the quote
    const result = await Quote.deleteOne({ sys_id: sysId });
    console.log('Delete operation result:', result);

    console.log(`✅ Successfully deleted quote: ${quote.name || quote._id}`);

    res.status(200).json({
      success: true,
      message: `Quote with sys_id ${sysId} successfully deleted`
    });
  } catch (error) {
    console.error('❌ ERROR in deleteQuote:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = deleteQuote;
