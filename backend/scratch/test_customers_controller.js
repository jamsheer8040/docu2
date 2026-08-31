const { Customer } = require('../models');

async function test() {
  try {
    const { count, rows } = await Customer.findAndCountAll({
      where: { tenant_id: 1, is_active: true },
      limit: 1000,
      offset: 0,
      order: [['name', 'ASC']]
    });

    console.log(JSON.stringify({
      success: true,
      data: rows,
      meta: {
        total: count
      }
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
