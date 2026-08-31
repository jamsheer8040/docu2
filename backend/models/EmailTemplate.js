const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailTemplate = sequelize.define('EmailTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      'invoice_issued',
      'payment_received',
      'document_reminder',
      'document_expired',
      'sales_order_confirmation',
      'manual'
    ),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  body_html: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'email_templates',
  timestamps: true,
  underscored: true
});

module.exports = EmailTemplate;
