const { ServiceOrder, ServiceType } = require('./models/index.js');

(async () => {
  const order = await ServiceOrder.findOne({ 
    where: { id: 25 },
    include: [{ model: ServiceType }]
  });
  console.log('Order 25 Service Type:', order.ServiceType.toJSON());
  process.exit(0);
})();
