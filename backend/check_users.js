const sequelize = require('./config/database');
const User = require('./models/User');

(async () => {
  const users = await User.findAll({ attributes: ['id', 'email', 'tenant_id'] });
  console.log('Users:', users.map(u => u.toJSON()));
  process.exit(0);
})();
