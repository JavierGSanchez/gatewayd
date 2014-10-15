var db = require('../sequelize');
const Sequelize = require('sequelize');
const Promise = require('bluebird');

var RippleAddress = db.define('ripple_addresses', {
  id: { 
		type: Sequelize.INTEGER, 
		primaryKey: true,
		autoIncrement: true
	},
  user_id: { 
    type: Sequelize.INTEGER
  },
  managed: { 
    type: Sequelize.BOOLEAN, 
    validate: { 
      notNull: true 
    }
  },
  address: { 
    type: Sequelize.STRING,
    validate: { 
      notNull: true,
      len: [20, 35]
    }
  },
  type: { 
    type: Sequelize.STRING, 
    notNull: true,
    validate: { 
      notNull: true,
      isIn: [['hot','cold','hosted','independent']]
    }
  },
  secret: { 
    type: Sequelize.STRING,
  },
  tag: { 
    type: Sequelize.INTEGER,
  },
  previous_transaction_hash: { 
    type: Sequelize.STRING,
  },
  uid: {
    type: Sequelize.STRING,
    unique: true
  },
  data: {
    type: Sequelize.STRING
  }
}, {
  instanceMethods: {
    setLastPaymentHash: function(hash) {
      var data = this.data || {}
      data.lastPaymentHash = hash;
      return this.updateAttributes({
        data: data
      });
    },
    getLastPaymentHash: function() {
      if (this.data) {
        return this.data.lastPaymentHash;
      } else {
        return null;
      }
    }
  },
  getterMethods: {
    data: function () {
      try {
        return JSON.parse(this.getDataValue('data'));
      } catch(e) {
        return this.getDataValue('data');
      }
    }
  },
  setterMethods: {
    data: function (value) {
      this.setDataValue('data', JSON.stringify(value));
    }
  }
});

module.exports = RippleAddress;
