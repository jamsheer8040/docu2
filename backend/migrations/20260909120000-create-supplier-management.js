module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suppliers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      contact_person: { type: Sequelize.STRING(150), allowNull: true },
      email: { type: Sequelize.STRING(100), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    
    await queryInterface.createTable('supplier_purchases', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' } },
      reference_type: { type: Sequelize.ENUM('ServiceOrder', 'InvoiceItem', 'Manual'), allowNull: false },
      reference_id: { type: Sequelize.INTEGER, allowNull: true },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      paid_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
      status: { type: Sequelize.ENUM('Unpaid', 'Partially Paid', 'Paid'), allowNull: false, defaultValue: 'Unpaid' },
      description: { type: Sequelize.STRING(255), allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('supplier_payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      supplier_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'suppliers', key: 'id' } },
      purchase_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'supplier_purchases', key: 'id' } },
      wallet_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'wallet_accounts', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_date: { type: Sequelize.DATE, allowNull: false },
      reference: { type: Sequelize.STRING(100), allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addColumn('service_orders', 'cost_type', {
      type: Sequelize.ENUM('Wallet', 'Supplier'),
      allowNull: true
    });
    // cost_supplier_id in ServiceOrder model is BIGINT — match the model definition
    await queryInterface.addColumn('service_orders', 'cost_supplier_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'suppliers', key: 'id' }
    });

    await queryInterface.addColumn('invoice_items', 'cost_type', {
      type: Sequelize.ENUM('Wallet', 'Supplier'),
      allowNull: true
    });
    // cost_supplier_id is INTEGER in InvoiceItem
    await queryInterface.addColumn('invoice_items', 'cost_supplier_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'suppliers', key: 'id' }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoice_items', 'cost_supplier_id');
    await queryInterface.removeColumn('invoice_items', 'cost_type');
    await queryInterface.removeColumn('service_orders', 'cost_supplier_id');
    await queryInterface.removeColumn('service_orders', 'cost_type');
    await queryInterface.dropTable('supplier_payments');
    await queryInterface.dropTable('supplier_purchases');
    await queryInterface.dropTable('suppliers');
  }
};
