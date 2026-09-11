const { ServiceOrder } = require('./models');

(async () => {
  const order = await ServiceOrder.findOne({ where: { id: 25 } });
  console.log(JSON.stringify(order.toJSON(), null, 2));
  process.exit(0);
})();
