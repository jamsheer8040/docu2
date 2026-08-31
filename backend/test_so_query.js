const db = require('./models');

async function test() {
  try {
    const salesOrders = await db.SalesOrder.findAll({
      where: { tenant_id: 1 },
      include: [
        { model: db.Customer, attributes: ['id', 'name', 'email', 'phone_whatsapp'] },
        { model: db.User, as: 'SalesExecutive', attributes: ['id', 'name', 'email'] },
        { 
          model: db.SalesOrderItem, 
          include: [
            { model: db.ServiceType, attributes: ['id', 'name'] }
          ] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    console.log(`Found ${salesOrders.length} sales orders.`);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit();
  }
}
test();
