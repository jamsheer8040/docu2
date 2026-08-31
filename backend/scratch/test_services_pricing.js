const { ServiceType, ServiceTypePricing } = require('../models');

async function test() {
  try {
    const types = await ServiceType.findAll({
      include: [{ model: ServiceTypePricing }]
    });
    console.log(JSON.stringify(types, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
