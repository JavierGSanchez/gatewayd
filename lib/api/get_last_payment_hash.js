const config = require(__dirname+'/../../config/environment.js');
const RippleAddress = require(__dirname+'/../data').models.rippleAddresses;

/**
 * @require config
 * @description This function gets the last
 * transaction has from the config file.
 *
 * @param {callback} - callback
 */
module.exports = function (callback){
  return RippleAddress.findOrCreate({
    address: config.get('HOT_WALLET').address,
    type: 'hot'
  })
  .then(function(address) {
    console.log(address);
    callback(null, address.getLastPaymentHash());
  })
  .error(callback);
};
