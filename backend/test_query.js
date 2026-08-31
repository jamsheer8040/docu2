const db = require('./models');

async function test() {
  try {
    const { count, rows } = await db.Customer.findAndCountAll({
      where: { tenant_id: 1, is_active: true },
      limit: 1000,
      offset: 0,
      order: [['name', 'ASC']]
    });
    console.log(`Found ${count} active customers.`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
