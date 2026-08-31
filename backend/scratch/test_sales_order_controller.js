const { SalesOrder, Customer, SalesOrderItem } = require('../models');

async function test() {
  try {
    const { count, rows } = await SalesOrder.findAndCountAll({
      where: { tenant_id: 1 },
      include: [
        { model: Customer, attributes: ['id', 'name', 'email'] },
        { model: SalesOrderItem }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log("Success! Found", count, "orders");
    process.exit(0);
  } catch (err) {
    console.error("Error fetching sales orders:", err);
    process.exit(1);
  }
}

test();
