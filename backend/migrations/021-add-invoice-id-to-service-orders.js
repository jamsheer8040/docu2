'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists to avoid errors on multiple runs
    const tableInfo = await queryInterface.describeTable('service_orders');
    if (!tableInfo.invoice_id) {
      await queryInterface.addColumn('service_orders', 'invoice_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('service_orders');
    if (tableInfo.invoice_id) {
      await queryInterface.removeColumn('service_orders', 'invoice_id');
    }
  }
};
