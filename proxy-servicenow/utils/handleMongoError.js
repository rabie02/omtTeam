module.exports = (res, serviceNowData, error, operation) => {
    console.error(`MongoDB ${operation} error:`, error);
    return res.status(500).json({
      error: `Operation partially failed - Success in ServiceNow but failed in MongoDB (${operation})`,
      serviceNowSuccess: serviceNowData,
      mongoError: error.message
    });
  };