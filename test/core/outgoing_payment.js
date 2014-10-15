var assert = require('assert');
var gateway = require(__dirname+'/../../');
var OutgoingPayment = require(__dirname+'/../../lib/core/outgoing_payment.js');
var fixtures = require(__dirname+'/../fixtures/transactions.js');
var outgoingTransactionRecord;
var restConfirmationResponse;

describe('Outgoing Payment', function() {
  describe('Sending a queued payment to ripple', function() {

    it('should mark a record as sent once successfully communicated to ripple rest', function(done) {
      var outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);
      assert.strictEqual(outgoingPayment.record.state, 'outgoing');

      var rippleRestResponse = {
        success: true,
        client_resource_id: 'a2837056-20e8-410a-b730-879dd0493742',
        status_url: 'http://localhost:5990/v1/accounts/rscJF4TWS2jBe43MvUomTtCcyrbtTRMSNr/payments/a2837056-20e8-410a-b730-879dd0493742'
      };

      outgoingPayment._finalizeOutgoingPayment(rippleRestResponse, function() {
        assert.strictEqual(outgoingPayment.record.state, 'sent');
        done();
      });
    });

    it('should record the rejection of a payment from the Ripple Ledger', function(done) {
      var outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);
      var confirmationResponse = new Object(restConfirmationResponse);
      confirmationResponse.result = 'temPATH_DRY';

      outgoingPayment._recordAcceptanceOrRejectionStatus(confirmationResponse, function(error) {
        assert(!error);
        assert.strictEqual(outgoingPayment.record.state, 'failed');
        done();
      });
    });

    it('should record the failure of a payment upon submission to ripple rest', function(done) {
      var outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);
      outgoingPayment._handleRippleRestFailure('No path found. Please try ....', function(error) {
        assert(!error);
        assert.strictEqual(outgoingPayment.record.state, 'failed');
        done();
      });
    });

    it('should retry a payment by moving it back to the "outgoing" queue', function(done) {
      var outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);
      outgoingPayment._handleRippleRestFailure('retry', function(error) {
        assert(!error);
        assert.strictEqual(outgoingPayment.record.state, 'outgoing');
        done();
      });
    });

    it('should record sent and confirmed a ripple payment with a hash', function(done){
      this.timeout(10000);
      var outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);

      outgoingPayment._sendAndConfirmPayment(fixtures.valid_xrp_payment, function(error, response){
        assert(!error);
        assert(response.hash);
        assert.strictEqual(response.result, 'tesSUCCESS');
        done();
      });
    });

    var outgoingPayment;

    before(function(done) {
      outgoingPayment = new OutgoingPayment(outgoingTransactionRecord);
      done();
    });

  });

  before(function(done) {
    gateway.data.models.rippleTransactions.create({
      to_address_id: 820,
      from_address_id: 623,
      to_amount: '0.0019399999999999999',
      to_currency: 'XRP',
      to_issuer: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
      from_amount: '0.002',
      from_currency: 'XRP',
      from_issuer: 'r4EwBWxrx5HxYRyisfGzMto3AT8FZiYdWk',
      state: 'outgoing',
      external_transaction_id: 169
    }).complete(function(error, rippleTransaction) {
      outgoingTransactionRecord = rippleTransaction;
      done();
    });

    restConfirmationResponse = {
      source_account: 'rscJF4TWS2jBe43MvUomTtCcyrbtTRMSNr',
      source_tag: '623',
      source_amount: { value: '0.001939', currency: 'XRP', issuer: '' },
      source_slippage: '0',
      destination_account: 'rp4u5gEskM8DtBZvonZwbu6dspgVdeAGM6',
      destination_tag: '',
      destination_amount: { value: '0.001939', currency: 'XRP', issuer: '' },
      invoice_id: '',
      paths: '[]',
      no_direct_ripple: false,
      partial_payment: false,
      direction: 'outgoing',
      state: 'validated',
      result: 'tesSUCCESS',
      ledger: '',
      hash: '9DDCEBAB6D751C22755F9303B59E1E2FDC8308B551A4C5AE89343BD6F2255169',
      timestamp: '2014-06-30T00:28:46.000Z',
      fee: '0.000012',
      source_balance_changes: [],
      destination_balance_changes: []
    };

  });

  after(function(done) {
    outgoingTransactionRecord.destroy().complete(done);
  });

});
