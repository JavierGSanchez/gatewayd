const gatewayd = require(__dirname+'/../../../../');
const RippleAddress = gatewayd.models.rippleAddresses;

module.exports = function(request, response){
  gatewayd.api.getLastPaymentHash()
  .then(function(hash) {
    response
      .status(200)
      .send({
        success: true,
        last_payment_hash: hash
      });
  })
  .error(function(error) {
    response
      .status(500)
      .send({ error: error })
  });
};
