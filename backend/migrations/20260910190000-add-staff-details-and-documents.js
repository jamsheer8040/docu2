'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userTableInfo = await queryInterface.describeTable('users');

    const userColumnsToAdd = [
      { name: 'phone', spec: { type: Sequelize.STRING(50), allowNull: true } },
      { name: 'address', spec: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'home_country_address', spec: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'home_country_contact', spec: { type: Sequelize.STRING(50), allowNull: true } },
      { name: 'home_country_alternate_contact', spec: { type: Sequelize.STRING(50), allowNull: true } },
      { name: 'designation', spec: { type: Sequelize.STRING(100), allowNull: true } },
      { name: 'joining_date', spec: { type: Sequelize.DATEONLY, allowNull: true } },
      { name: 'basic_salary', spec: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 } },
      { name: 'hr_allowance', spec: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 } },
      { name: 'other_allowances', spec: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 } },
      { name: 'total_salary', spec: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 } }
    ];

    for (const col of userColumnsToAdd) {
      if (!userTableInfo[col.name]) {
        await queryInterface.addColumn('users', col.name, col.spec);
      }
    }

    // Create staff_documents table if not exists
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map(t => (typeof t === 'string' ? t : t.tableName || Object.values(t)[0]));
    
    if (!tableNames.includes('staff_documents')) {
      await queryInterface.createTable('staff_documents', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        document_type_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'document_types',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        doc_number: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        issue_date: {
          type: Sequelize.DATEONLY,
          allowNull: true
        },
        expiry_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        file_path: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tenants',
            key: 'id'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      await queryInterface.addIndex('staff_documents', ['user_id']);
      await queryInterface.addIndex('staff_documents', ['expiry_date']);
      await queryInterface.addIndex('staff_documents', ['tenant_id']);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map(t => (typeof t === 'string' ? t : t.tableName || Object.values(t)[0]));

    if (tableNames.includes('staff_documents')) {
      await queryInterface.dropTable('staff_documents');
    }

    const userTableInfo = await queryInterface.describeTable('users');
    const colsToRemove = [
      'phone', 'address', 'home_country_address', 'home_country_contact',
      'home_country_alternate_contact', 'designation', 'joining_date',
      'basic_salary', 'hr_allowance', 'other_allowances', 'total_salary'
    ];

    for (const col of colsToRemove) {
      if (userTableInfo[col]) {
        await queryInterface.removeColumn('users', col);
      }
    }
  }
};
