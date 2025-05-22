const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { specId } = req.params;

    console.log("✅ Appel reçu dans getBySpec pour specId:", specId);
    console.log("🧠 Token décodé (req.user) :", req.user); // ✅ log pour inspection

    const snToken = req.user?.sn_access_token;

    if (!snToken) {
      return res.status(401).json({
        success: false,
        message: "❌ Aucun token ServiceNow fourni dans le JWT."
      });
    }

    const response = await axios.get(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering`,
      {
        headers: {
          Authorization: `Bearer ${snToken}`
        },
        params: {
          sysparm_query: `product_specification=${specId}`,
          sysparm_display_value: true,
          sysparm_limit: 50
        }
      }
    );

    res.json({ success: true, data: response.data.result });

  } catch (error) {
    console.error('❌ Erreur lors de l’appel à ServiceNow :', error.message);
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
};
