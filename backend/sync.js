require('dotenv').config();
const { sequelize } = require('./models');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Sync all models cleanly
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    
    const [results] = await sequelize.query("SHOW TABLES");
    console.log("Current Tables in Database:");
    console.log(results);
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or sync:', error);
    process.exit(1);
  }
}

syncDB();
