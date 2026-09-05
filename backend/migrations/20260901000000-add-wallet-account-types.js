'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // The account_type column was already added by a partial run of this migration.
    // Now handle the remaining columns.

    // We need bill_day and due_day. The table already has statement_day and payment_due_day.
    // Rename them to match the new model.
    const tableDesc = await queryInterface.describeTable('wallet_accounts');

    // Add bill_day if not exists (rename from statement_day)
    if (tableDesc.statement_day && !tableDesc.bill_day) {
      await queryInterface.renameColumn('wallet_accounts', 'statement_day', 'bill_day');
    } else if (!tableDesc.bill_day) {
      await queryInterface.addColumn('wallet_accounts', 'bill_day', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      });
    }

    // Add due_day if not exists (rename from payment_due_day)
    if (tableDesc.payment_due_day && !tableDesc.due_day) {
      await queryInterface.renameColumn('wallet_accounts', 'payment_due_day', 'due_day');
    } else if (!tableDesc.due_day) {
      await queryInterface.addColumn('wallet_accounts', 'due_day', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      });
    }

    // Remove old 'type' and 'bank_code' columns if they exist
    if (tableDesc.type) {
      // Migrate old type data to account_type before dropping
      await queryInterface.sequelize.query(`
        UPDATE wallet_accounts 
        SET account_type = CASE 
          WHEN type = 'cash' THEN 'Cash'
          WHEN type = 'bank' THEN 'Debit'
          WHEN type = 'credit_card' THEN 'Credit'
          ELSE account_type
        END
        WHERE type IS NOT NULL
      `);
      await queryInterface.removeColumn('wallet_accounts', 'type');
    }

    if (tableDesc.bank_code) {
      await queryInterface.removeColumn('wallet_accounts', 'bank_code');
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse: add back old columns, rename back
    const tableDesc = await queryInterface.describeTable('wallet_accounts');

    if (tableDesc.bill_day) {
      await queryInterface.renameColumn('wallet_accounts', 'bill_day', 'statement_day');
    }
    if (tableDesc.due_day) {
      await queryInterface.renameColumn('wallet_accounts', 'due_day', 'payment_due_day');
    }

    if (!tableDesc.type) {
      await queryInterface.addColumn('wallet_accounts', 'type', {
        type: Sequelize.ENUM('bank', 'credit_card', 'cash'),
        allowNull: true
      });
    }
    if (!tableDesc.bank_code) {
      await queryInterface.addColumn('wallet_accounts', 'bank_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }
  }
};
