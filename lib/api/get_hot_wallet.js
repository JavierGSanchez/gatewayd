const config = require(__dirname+'/../../config/config.js');
const RippleAddress = require(__dirname+'/../data/').models.rippleAddresses;

module.exports = function(callback) {
  if (!config.get('HOT_WALLET').address) {
    throw new Error('Gateway HOT_WALLET not set in config');
  }
  RippleAddress.findOrCreate({
    address: config.get('HOT_WALLET').address,
    type: 'hot',
    managed: true
  })
  .then(function(address) {
    callback(null, address); 
  })
  .error(callback);
}

