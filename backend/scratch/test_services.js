const { ServiceType } = require('../models');

async function test() {
  try {
    const types = await ServiceType.findAll();
    console.log("Success! Found", types.length, "service types");
    process.exit(0);
  } catch (err) {
    console.error("Error fetching service types:", err);
    process.exit(1);
  }
}
test();
