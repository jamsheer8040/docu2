const { SystemConfig } = require('./models');

(async () => {
  const globalConfigs = await SystemConfig.findAll({ where: { tenant_id: null } }) || [];
  const tenantConfigs = await SystemConfig.findAll({ where: { tenant_id: 2 } });
  
  const configs = [...globalConfigs];
  tenantConfigs.forEach(tc => {
    const idx = configs.findIndex(c => c.key === tc.key);
    if (idx > -1) configs[idx] = tc;
    else configs.push(tc);
  });
  const configMap = {};
  configs.forEach(c => {
    try {
      configMap[c.key] = JSON.parse(c.value);
    } catch (e) {
      configMap[c.key] = c.value;
    }
  });
  console.log('API Output:', configMap);
  process.exit(0);
})();
