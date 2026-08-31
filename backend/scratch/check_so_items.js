const { SalesOrder, SalesOrderItem, ServiceOrder, ServiceType, ServiceTypePricing } = require('../models');

async function test() {
  try {
    const items = await SalesOrderItem.findAll({
      include: [
        { model: SalesOrder },
        { model: ServiceType, include: [ServiceTypePricing] }
      ],
      limit: 10,
      order: [['created_at', 'DESC']]
    });
    console.log(JSON.stringify(items.map(i => ({
      so_number: i.SalesOrder.order_number,
      service: i.service_name,
      cost: i.cost,
      service_charge: i.service_charge,
      estimated_price: i.estimated_price
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
