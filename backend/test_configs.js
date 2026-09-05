const { SystemConfig } = require('./models');
SystemConfig.findAll().then(configs => {
    console.log(configs.map(c => c.dataValues));
    process.exit(0);
});
