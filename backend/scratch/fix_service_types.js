const { sequelize } = require('../models');

async function fix() {
  try {
    await sequelize.getQueryInterface().addColumn('service_types', 'service_charge', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false
    });
    console.log("Column 'service_charge' added to 'service_types'.");
    process.exit(0);
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log("Column already exists.");
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}
fix();
