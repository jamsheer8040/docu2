const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCustomer = sequelize.define('UserCustomer', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'user_customers',
  timestamps: true,
  underscored: true
});

module.exports = UserCustomer;
