'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('service_orders', 'requires_follow_up', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('service_orders', 'is_follow_up_done', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('service_orders', 'requires_follow_up');
    await queryInterface.removeColumn('service_orders', 'is_follow_up_done');
  }
};
