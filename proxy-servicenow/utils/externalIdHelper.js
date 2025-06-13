const axios = require('axios');

module.exports = async (connection, urlPath, mongoID)=>{
  await axios.patch(
      `${connection.baseURL}/${urlPath}`,
      {external_id: mongoID},
      { headers: connection.headers }
    );
}
