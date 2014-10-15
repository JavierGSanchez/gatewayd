const gatewayd = require(__dirname+'/../../../../');

/*
* @requestuire Api
* @function setLastPaymentHash
* @description HTTP version of setLastPaymentHash api call
* @param {RippleTransactionHash} payment_hash
*
*/

module.exports = function(request, response){
  gatewayd.api.setLastPaymentHash(request.body.payment_hash)
  .then(function(hash) {
    response
      .status(200)
      .send({
        sucecss: true,
        last_payment_hash: hash
      });
  })
  .error(function(error) {
    response
      .status(500)
      .send({ error: error })
  });
};

