var RippleRestClient = require('ripple-rest-client');
var uuid = require('node-uuid');
var async = require('async');
var gateway = require(__dirname+'/../../');
var hotWallet = gateway.config.get('HOT_WALLET');

function OutgoingPayment(outgoingPaymentRecord) {
  this.record = outgoingPaymentRecord;
  this.rippleRestClient = new RippleRestClient({
    account: hotWallet.address,
    secret: hotWallet.secret
  });
}

OutgoingPayment.prototype = {

  processOutgoingPayment: function(callback) {
    var self = this;
    async.waterfall([
      function(next) {
        self._getRippleAddressRecord(next);
      },
      function(address, next) {
        self._buildPayment(address, next);
      },
      function(payment, next) {
        self._sendAndConfirmPayment(payment, next);
      },
      function(paymentResponse, next) {
        self._recordAcceptanceOrRejectionStatus(paymentResponse, next);
      },
      function(response, next) {
        self._finalizeOutgoingPayment(response, next);
      }
    ], function(error) {
      if (error) {
        self._handleRippleRestFailure(error, function() {
          logger.error('payments:outgoing:failed', error, self.record.toJSON());
          callback(error, self.record);
        });
      } else {
        logger.info('payment:outgoing:succeeded', self.record.toJSON());
        callback(error, self.record);
      }
    });
  },

  _recordAcceptanceOrRejectionStatus: function(payment, callback) {
    var self = this;
    self.record.transaction_state = payment.result;
    self.record.transaction_hash = payment.hash;
    switch(self.record.transaction_state) {
    case 'tesSUCCESS':
      self.record.state = 'succeeded';
      break;
    default:
      self.record.state = 'failed';
    }
    self.record.save().complete(function(error, record){
      //depositCallbackJob.perform([self.record.id], console.log);
      callback(null, record);
    });
  },

  _finalizeOutgoingPayment: function(response, callback) {
    var self = this;
    self.record.state = 'sent';
    self.record.uid = response.client_resource_id;
    self.record.save().complete(function(){
      callback(null, response);
    });
  },

  _handleRippleRestFailure: function(error, callback) {
    var self = this;
    if (error && typeof error === 'string' && error.match('No paths found')){
      error = 'noPathFound';
    } else if (error && typeof error === 'string' && error.match('No connection to rippled') ||
        error.match('ECONNREFUSED') ||
        error.match('try again') ||
        error.match('Cannot connect to rippled') ||
        error.match('RippledConnectionError'))
    {
      error = 'retry';
    }
    
    switch(error) {
      case 'retry':
        self.record.state = 'outgoing';
        break;
      case 'noPathFound':
        self.record.transaction_state = 'tecPATH_DRY';
        self.record.state = 'failed';
        break;
      default:
        self.record.state = 'failed';
    }
    self.record.save().complete(function(){
      //depositCallbackJob.perform([self.record.id], console.log);
      callback();
    });
  },

  _getRippleAddressRecord: function(callback) {
    var self = this;
    gateway.data.rippleAddresses.read(self.record.to_address_id, callback);
  },
  
  _buildPayment: function(address, callback) {
    var self = this;
    self.rippleRestClient.buildPayment({
      amount: self.record.to_amount,
      currency: self.record.to_currency,
      issuer: self.record.to_issuer,
      account: hotWallet.address,
      recipient: address.address
    }, function(error, response) {
      if (error) { 
        return callback(error.message, null); 
      }
      if (response && response.success) {
        var payment = response.payments[0];
        if (payment) {
          if (address.tag) {
              payment.destination_tag = address.tag.toString();
          }
          callback(null, payment);
        } else {
          callback('BuildPaymentError', null);
        }
      } else {
        callback(response.message, null);
      }
    });
  },

  _sendAndConfirmPayment: function(payment, callback) {
    var self = this;
    if (payment) {
      if (payment.source_tag) {
        payment.source_tag = self.record.from_address_id.toString();
      }
    } else {
      return callback('no payment', null);
    }

    self.rippleRestClient.sendAndConfirmPayment({
      payment: payment,
      client_resource_id: uuid.v4(),
      secret: hotWallet.secret
    }, function(error, response){

      if (error) {
        callback(error, null);
      } else if (response){
        callback(null, response);
      }
    });
  }

};

module.exports = OutgoingPayment;

