const { Customer } = require('./models');
Customer.findAll().then(c => {
  console.log(c.map(x => ({id: x.id, name: x.name, is_active: x.is_active})));
  process.exit(0);
});
