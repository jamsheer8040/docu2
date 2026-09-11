const sequelize = require('./config/database');
const ServiceOrder = require('./models/ServiceOrder');

(async () => {
  const order = await ServiceOrder.findOne({ where: { id: 25 } });
  console.log('Order 25:', order ? { id: order.id, status: order.status, is_cost_deducted: order.is_cost_deducted } : 'Not found');
  process.exit(0);
})();
