'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_cvs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      profession: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      template: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'TemplateOne'
      },
      data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('saved_cvs', ['tenant_id', 'user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saved_cvs');
  }
};
