'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add is_cost_deducted to service_orders
    const tableInfo = await queryInterface.describeTable('service_orders');
    
    if (!tableInfo.is_cost_deducted) {
      await queryInterface.addColumn('service_orders', 'is_cost_deducted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('service_orders');
    
    if (tableInfo.is_cost_deducted) {
      await queryInterface.removeColumn('service_orders', 'is_cost_deducted');
    }
  }
};
