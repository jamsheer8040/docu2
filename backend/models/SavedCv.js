const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedCv = sequelize.define('SavedCv', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  profession: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  template: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'TemplateOne'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'saved_cvs',
  timestamps: true,
  underscored: true
});

module.exports = SavedCv;
