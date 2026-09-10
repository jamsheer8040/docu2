'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, permissions FROM roles;`
    );

    for (const role of roles) {
      let perms = role.permissions;
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          console.warn(`[Migration] Could not parse permissions for role id=${role.id}, skipping.`);
          continue;
        }
      }

      let changed = false;

      // Add tools permission if missing
      if (!perms.tools) {
        perms.tools = { read: true, write: true, delete: true };
        changed = true;
      }

      // Add suppliers permission if missing
      if (!perms.suppliers) {
        perms.suppliers = { read: true, write: true, delete: true };
        changed = true;
      }

      if (changed) {
        // Use parameterized query to prevent SQL injection
        await queryInterface.sequelize.query(
          `UPDATE roles SET permissions = :permissions WHERE id = :id`,
          {
            replacements: {
              permissions: JSON.stringify(perms),
              id: role.id
            }
          }
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Reverting JSON field additions is not necessary
  }
};
