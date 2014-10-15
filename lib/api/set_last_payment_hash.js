var config = require(__dirname+'/../../config/environment.js');
const RippleAddress = require(__dirname+'/../data/').rippleAddresses;

/**
* @require Config
* @function setLastPaymentHash
* @description In order to poll Ripple REST for new payment notifications to
* the Gateway cold wallet, a starting-point transaction hash
* must be set.
*
* @param opts
* @param opts.hash Last transaction hash of the cold wallet address
* @params {function} callback
*/

module.exports = function(options, callback){
  RippleAddress.find(gatewayd.config.get('HOT_WALLET').id) 
  .then(function(address) {
    return address.setLastPaymentHash(options.hash)
    .then(function(address) {
      callback(null, address.getLastPaymentHash());
    })
  })
  .error(callback);
};
