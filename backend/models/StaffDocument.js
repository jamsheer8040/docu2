const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffDocument = sequelize.define('StaffDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  document_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'document_types',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  doc_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  days_until_expiry: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.expiry_date) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(this.expiry_date);
      const diffTime = expiry - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  },
  expiry_status: {
    type: DataTypes.VIRTUAL,
    get() {
      const days = this.days_until_expiry;
      if (days === null) return 'unknown';
      if (days < 0) return 'expired';
      if (days <= 7) return 'critical';
      if (days <= 30) return 'due_soon';
      return 'active';
    }
  }
}, {
  tableName: 'staff_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['expiry_date'] },
    { fields: ['tenant_id'] }
  ]
});

module.exports = StaffDocument;
