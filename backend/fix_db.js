const db = require('./models');

async function fix() {
  try {
    await db.sequelize.query(`
      ALTER TABLE sales_order_items
      ADD COLUMN confirmed TINYINT(1) DEFAULT 0,
      ADD COLUMN confirm_notes TEXT,
      ADD COLUMN cancelled TINYINT(1) DEFAULT 0,
      ADD COLUMN cancel_notes TEXT;
    `);
    console.log("Successfully added missing columns to sales_order_items");
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log("Columns already exist.");
    } else {
      console.error("ERROR:", err);
    }
  } finally {
    process.exit();
  }
}
fix();
