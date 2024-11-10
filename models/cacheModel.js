const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
  apiId: String,
  params: Object,
  response: Object,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: process.env.DEFAULT_CACHE_DURATION || '30d'  // Auto-delete after expiration
  }
});

module.exports = mongoose.model('Cache', cacheSchema);
