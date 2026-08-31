'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create email_templates table
    await queryInterface.createTable('email_templates', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: Sequelize.ENUM(
          'invoice_issued',
          'payment_received',
          'document_reminder',
          'document_expired',
          'sales_order_confirmation',
          'manual'
        ),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      body_html: {
        type: Sequelize.TEXT('long'),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Create email_logs table
    await queryInterface.createTable('email_logs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      recipient: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      template_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('sent', 'failed'),
        allowNull: false,
        defaultValue: 'sent'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sent_by: {
        type: Sequelize.INTEGER,
        allowNull: true
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_logs');
    await queryInterface.dropTable('email_templates');
  }
};
