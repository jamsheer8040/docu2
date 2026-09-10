'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('invoice_items');
    
    if (!tableInfo.service_order_id) {
      await queryInterface.addColumn('invoice_items', 'service_order_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'service_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('invoice_items');
    
    if (tableInfo.service_order_id) {
      await queryInterface.removeColumn('invoice_items', 'service_order_id');
    }
  }
};
