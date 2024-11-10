const axios = require('axios');
const Cache = require('../models/cacheModel');
const config = require('../config/api_config.json');

async function proxyRequest(req, res) {
  const { id, forced, ...params } = req.query;
  const apiConfig = config.find(api => api.id === id);
  if (!apiConfig) return res.status(404).json({ error: 'API configuration not found.' });

  // Map local parameters to remote parameters based on configuration
  const mappedParams = {};
  for (const [localParam, remoteParam] of Object.entries(apiConfig.paramMap || {})) {
    if (params[localParam] !== undefined) {
      mappedParams[remoteParam] = params[localParam];
    }
  }

  // Check the cache before making a new API request
  const cacheData = await Cache.findOne({ apiId: id, params: mappedParams });
  if (cacheData && !forced) return res.json(cacheData.response);

  try {
    let url = apiConfig.endpoint;
    const requestConfig = {};

    // Set API key based on location
    if (apiConfig.apiKey) {
      if (apiConfig.apiKeyLocation === 'header') {
        requestConfig.headers = { Authorization: `Bearer ${apiConfig.apiKey}` };
      } else if (apiConfig.apiKeyLocation === 'query') {
        mappedParams.api_key = apiConfig.apiKey;
      }
    }

    // Make the API request
    const apiResponse = await axios.get(url, { params: mappedParams, ...requestConfig });

    // Update the cache with the new response data
    await Cache.findOneAndUpdate(
      { apiId: id, params: mappedParams },
      { response: apiResponse.data },
      { upsert: true }
    );

    res.json(apiResponse.data);
  } catch (error) {
    console.error(`Error fetching data from API ${id}:`, error.message);
    res.status(error.response ? error.response.status : 500).json({ error: 'Error fetching data from remote API.' });
  }
}

module.exports = { proxyRequest };
