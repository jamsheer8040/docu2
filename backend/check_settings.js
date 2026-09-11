const sequelize = require('./config/database');
const SystemConfig = require('./models/SystemConfig');

(async () => {
  const configs = await SystemConfig.findAll({ where: { tenant_id: 1 } });
  console.log('Configs for tenant 1:', configs.map(c => ({ key: c.key, value: c.value })));
  process.exit(0);
})();
