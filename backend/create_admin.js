require('dotenv').config();
const { sequelize, User, Role } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('[Setup] Creating Admin Credentials...');
    await sequelize.authenticate();

    // 1. Ensure Admin Role exists
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Admin' },
      defaults: {
        permissions: {
          dashboard: { read: true, write: true, delete: true },
          customers: { read: true, write: true, delete: true },
          documents: { read: true, write: true, delete: true },
          services: { read: true, write: true, delete: true },
          invoices: { read: true, write: true, delete: true },
          expenses: { read: true, write: true, delete: true },
          wallet: { read: true, write: true, delete: true },
          reports: { read: true, write: true, delete: true },
          settings: { read: true, write: true, delete: true }
        }
      }
    });
    console.log(`[Setup] Admin Role ID: ${adminRole.id}`);

    // 2. Create/Update Admin User
    const email = 'admin@test.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'System Administrator',
        password_hash: hashedPassword,
        role_id: adminRole.id,
        is_active: true
      }
    });

    if (!created) {
      await user.update({
        password_hash: hashedPassword,
        role_id: adminRole.id,
        is_active: true
      });
      console.log(`[Setup] Existing admin user updated.`);
    } else {
      console.log(`[Setup] New admin user created.`);
    }

    console.log('---------------------------------------------');
    console.log(`EMAIL:    ${email}`);
    console.log(`PASSWORD: ${password}`);
    console.log('---------------------------------------------');
    console.log('[Setup] Admin ready. You can now login.');
    process.exit(0);
  } catch (err) {
    console.error('[Setup] FAILED:', err);
    process.exit(1);
  }
}

createAdmin();
