// Always export models - they will work if mongoose is connected
// If MongoDB is not configured, these will still export but operations will fail gracefully
try {
  module.exports.Token = require('./token.model');
  module.exports.User = require('./user.model');
} catch (error) {
  // If models fail to load (mongoose not available), export nulls
  module.exports.Token = null;
  module.exports.User = null;
}
