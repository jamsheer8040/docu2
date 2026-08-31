const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  recipient: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  template_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed'),
    allowNull: false,
    defaultValue: 'sent'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sent_by: {
    type: DataTypes.INTEGER,
    allowNull: true // null = system/auto
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
  tableName: 'email_logs',
  timestamps: true,
  underscored: true,
  updatedAt: false
});

module.exports = EmailLog;
