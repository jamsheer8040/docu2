const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletAccount = sequelize.define('WalletAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  account_type: {
    type: DataTypes.ENUM('Cash', 'Debit', 'Credit'),
    allowNull: false,
    defaultValue: 'Cash'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'AED'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  credit_limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: null
  },
  bill_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: { min: 1, max: 31 }
  },
  due_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: { min: 1, max: 31 }
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'wallet_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['name', 'tenant_id'] }
  ]
});

module.exports = WalletAccount;
