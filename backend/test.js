const { Customer } = require('./models');
Customer.count({ where: { tenant_id: 1 } }).then(c => console.log('Total:', c)).catch(console.error);
Customer.count({ where: { tenant_id: 1, is_active: true } }).then(c => console.log('Active:', c)).catch(console.error);
