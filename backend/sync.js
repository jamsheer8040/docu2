require('dotenv').config();
const { sequelize } = require('./models');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Disable foreign key checks to allow clean table creation in any order
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.sync();
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('All models were synchronized successfully.');
    
    const [results] = await sequelize.query("SHOW TABLES");
    console.log("Current Tables in Database:", results.map(r => Object.values(r)[0]));
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or sync:', error);
    process.exit(1);
  }
}

syncDB();
