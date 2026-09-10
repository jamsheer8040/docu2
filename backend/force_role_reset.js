const { Role } = require('./models');

async function resetRoles() {
  try {
    console.log('[System] Force Resetting Role Permissions...');
    
    const adminPermissions = {
      dashboard: { read: true, write: true, delete: true },
      customers: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      services: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      expenses: { read: true, write: true, delete: true },
      sales_orders: { read: true, write: true, delete: true },
      suppliers: { read: true, write: true, delete: true },
      wallet: { read: true, write: true, delete: true },
      reports: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true }
    };

    const staffPermissions = {
      dashboard: { read: true, write: false, delete: false },
      customers: { read: true, write: true, delete: false },
      documents: { read: true, write: true, delete: false },
      services: { read: true, write: true, delete: false },
      invoices: { read: true, write: true, delete: false },
      expenses: { read: true, write: true, delete: false },
      sales_orders: { read: true, write: true, delete: false },
      suppliers: { read: true, write: true, delete: false },
      wallet: { read: true, write: false, delete: false },
      reports: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false }
    };

    // Force Update Admin
    await Role.update({ permissions: adminPermissions }, { where: { name: 'Admin' } });

    // Force Update Staff
    await Role.update({ permissions: staffPermissions }, { where: { name: 'Staff' } });

    console.log('[System] ROLES RESTORED TO FULL ACCESS.');
    process.exit(0);
  } catch (err) {
    console.error('[System] RESTORATION FAILED:', err);
    process.exit(1);
  }
}

resetRoles();
