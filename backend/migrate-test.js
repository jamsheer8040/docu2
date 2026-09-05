/**
 * SaaS Multi-Tenancy Integration Test
 * ------------------------------------
 * Tests every patched API endpoint to verify data isolation
 * and that nothing is broken after the tenant_id hardening.
 * 
 * Usage: node saas-integration-test.js
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'docclear_secret_key_2024';

// Color helpers for console
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

async function generateToken(tenantId) {
  const { User } = require('./models');
  const user = await User.findOne({ 
    where: { tenant_id: tenantId },
    include: [{ model: require('./models').Role }]
  });
  if (!user) return null;
  return jwt.sign(
    { id: user.id, email: user.email, tenant_id: user.tenant_id, role_id: user.role_id },
    JWT_SECRET
  );
}

async function apiCall(method, path, token, body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ${green('✓')} ${testName}`);
    passed++;
  } else {
    console.log(`  ${red('✗')} ${testName} ${detail ? red(`(${detail})`) : ''}`);
    failed++;
    failures.push({ testName, detail });
  }
}

function skip(testName, reason) {
  console.log(`  ${yellow('○')} ${testName} ${yellow(`(skipped: ${reason})`)}`);
  skipped++;
}

async function run() {
  console.log(bold('\n═══════════════════════════════════════════════'));
  console.log(bold('  SaaS Multi-Tenancy Integration Test Suite'));
  console.log(bold('═══════════════════════════════════════════════\n'));

  // ── Setup: Get tokens for tenant 1 ──
  const { sequelize, Tenant } = require('./models');
  await sequelize.authenticate();

  const tenants = await Tenant.findAll();
  if (tenants.length === 0) {
    console.log(red('No tenants found. Cannot run tests.'));
    process.exit(1);
  }

  const tenantId = tenants[0].id;
  const token = await generateToken(tenantId);
  
  if (!token) {
    console.log(red(`No user found for tenant ${tenantId}. Cannot run tests.`));
    process.exit(1);
  }

  console.log(cyan(`Testing with Tenant ID: ${tenantId}`));
  console.log(cyan(`Tenants in database: ${tenants.length}\n`));

  // ══════════════════════════════════════════
  //  1. DASHBOARD
  // ══════════════════════════════════════════
  console.log(bold('\n── Dashboard ──'));
  try {
    const r = await apiCall('GET', '/dashboard/stats', token);
    assert('Dashboard loads', r.ok && r.data.success, `status=${r.status}`);
    assert('Dashboard returns data object', r.data.data !== undefined);
  } catch (e) {
    assert('Dashboard loads', false, e.message);
  }

  try {
    const r = await apiCall('GET', '/dashboard/recent-activity', token);
    assert('Dashboard activity loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Dashboard activity loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  2. CUSTOMERS
  // ══════════════════════════════════════════
  console.log(bold('\n── Customers ──'));
  try {
    const r = await apiCall('GET', '/customers', token);
    assert('Customers list loads', r.ok && r.data.success, `status=${r.status}`);
    const customers = r.data.data || [];
    assert('All customers belong to tenant', customers.every(c => c.tenant_id === tenantId));
  } catch (e) {
    assert('Customers list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  3. DOCUMENTS
  // ══════════════════════════════════════════
  console.log(bold('\n── Documents ──'));
  try {
    const r = await apiCall('GET', '/documents', token);
    assert('Documents kanban loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Documents kanban loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  4. SERVICES
  // ══════════════════════════════════════════
  console.log(bold('\n── Services ──'));
  try {
    const r = await apiCall('GET', '/services/orders', token);
    assert('Services list loads', r.ok && r.data.success, `status=${r.status}`);
    const services = r.data.data || [];
    assert('All services belong to tenant', services.every(s => s.tenant_id === tenantId));
  } catch (e) {
    assert('Services list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  5. INVOICES
  // ══════════════════════════════════════════
  console.log(bold('\n── Invoices ──'));
  try {
    const r = await apiCall('GET', '/invoices', token);
    assert('Invoices list loads', r.ok && r.data.success, `status=${r.status}`);
    const invoices = r.data.data || [];
    assert('All invoices belong to tenant', invoices.every(i => i.tenant_id === tenantId));
  } catch (e) {
    assert('Invoices list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  6. EXPENSES
  // ══════════════════════════════════════════
  console.log(bold('\n── Expenses ──'));
  try {
    const r = await apiCall('GET', '/expenses', token);
    assert('Expenses list loads', r.ok && r.data.success, `status=${r.status}`);
    const expenses = r.data.data || [];
    assert('All expenses belong to tenant', expenses.every(e => e.tenant_id === tenantId));
  } catch (e) {
    assert('Expenses list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  7. WALLET
  // ══════════════════════════════════════════
  console.log(bold('\n── Wallet ──'));
  try {
    const r = await apiCall('GET', '/wallet/accounts', token);
    assert('Wallet accounts load', r.ok && r.data.success, `status=${r.status}`);
    const accounts = r.data.data || [];
    assert('All wallets belong to tenant', accounts.every(a => a.tenant_id === tenantId));
  } catch (e) {
    assert('Wallet accounts load', false, e.message);
  }

  // ══════════════════════════════════════════
  //  8. SALES ORDERS
  // ══════════════════════════════════════════
  console.log(bold('\n── Sales Orders ──'));
  try {
    const r = await apiCall('GET', '/sales-orders', token);
    assert('Sales Orders list loads', r.ok && r.data.success, `status=${r.status}`);
    const orders = r.data.data || [];
    assert('All sales orders belong to tenant', orders.every(o => o.tenant_id === tenantId));
  } catch (e) {
    assert('Sales Orders list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  9. USERS
  // ══════════════════════════════════════════
  console.log(bold('\n── Users ──'));
  try {
    const r = await apiCall('GET', '/users', token);
    assert('Users list loads', r.ok && r.data.success, `status=${r.status}`);
    const users = r.data.data || [];
    assert('All users belong to tenant', users.every(u => u.tenant_id === tenantId));
  } catch (e) {
    assert('Users list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  10. REPORTS (All endpoints)
  // ══════════════════════════════════════════
  console.log(bold('\n── Reports ──'));
  const reportEndpoints = [
    { path: '/reports/financial-summary', name: 'Financial Summary' },
    { path: '/reports/monthly-trends', name: 'Monthly Trends' },
    { path: '/reports/revenue-by-service', name: 'Revenue by Service' },
    { path: '/reports/expense-by-category', name: 'Expense by Category' },
    { path: '/reports/customer-summary', name: 'Customer Summary' },
    { path: '/reports/service-wise-details', name: 'Service Wise Report' },
    { path: '/reports/balance-sheet', name: 'Balance Sheet' },
  ];

  for (const ep of reportEndpoints) {
    try {
      const r = await apiCall('GET', ep.path, token);
      assert(`${ep.name} loads`, r.ok && r.data.success, `status=${r.status}`);
    } catch (e) {
      assert(`${ep.name} loads`, false, e.message);
    }
  }

  // ══════════════════════════════════════════
  //  11. CONFIG
  // ══════════════════════════════════════════
  console.log(bold('\n── Config ──'));
  try {
    const r = await apiCall('GET', '/config', token);
    assert('Config loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Config loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  12. DOCUMENT TYPES
  // ══════════════════════════════════════════
  console.log(bold('\n── Document Types ──'));
  try {
    const r = await apiCall('GET', '/document-types', token);
    assert('Document Types list loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Document Types list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  13. EXPENSE TYPES
  // ══════════════════════════════════════════
  console.log(bold('\n── Expense Types ──'));
  try {
    const r = await apiCall('GET', '/expense-types', token);
    assert('Expense Types list loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Expense Types list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  14. VOUCHER DESIGNS
  // ══════════════════════════════════════════
  console.log(bold('\n── Voucher Designs ──'));
  try {
    const r = await apiCall('GET', '/voucher-designs', token);
    assert('Voucher Designs list loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Voucher Designs list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  15. LEADS
  // ══════════════════════════════════════════
  console.log(bold('\n── Leads ──'));
  try {
    const r = await apiCall('GET', '/leads', token);
    assert('Leads list loads', r.ok && r.data.success, `status=${r.status}`);
  } catch (e) {
    assert('Leads list loads', false, e.message);
  }

  // ══════════════════════════════════════════
  //  CROSS-TENANT ISOLATION TEST
  // ══════════════════════════════════════════
  if (tenants.length >= 2) {
    console.log(bold('\n── Cross-Tenant Isolation ──'));
    const tenant2Id = tenants[1].id;
    const token2 = await generateToken(tenant2Id);

    if (token2) {
      // Get data from both tenants and verify no overlap
      const r1 = await apiCall('GET', '/customers', token);
      const r2 = await apiCall('GET', '/customers', token2);
      
      const ids1 = (r1.data.data || []).map(c => c.id);
      const ids2 = (r2.data.data || []).map(c => c.id);
      const overlap = ids1.filter(id => ids2.includes(id));
      
      assert('Tenant 1 and Tenant 2 have no customer overlap', overlap.length === 0, 
        overlap.length > 0 ? `${overlap.length} shared IDs: ${overlap.join(',')}` : '');

      // Services isolation
      const s1 = await apiCall('GET', '/services/orders', token);
      const s2 = await apiCall('GET', '/services/orders', token2);
      const sIds1 = (s1.data.data || []).map(s => s.id);
      const sIds2 = (s2.data.data || []).map(s => s.id);
      const sOverlap = sIds1.filter(id => sIds2.includes(id));
      
      assert('Tenant 1 and Tenant 2 have no service overlap', sOverlap.length === 0,
        sOverlap.length > 0 ? `${sOverlap.length} shared IDs` : '');

      // Invoice isolation
      const i1 = await apiCall('GET', '/invoices', token);
      const i2 = await apiCall('GET', '/invoices', token2);
      const iIds1 = (i1.data.data || []).map(i => i.id);
      const iIds2 = (i2.data.data || []).map(i => i.id);
      const iOverlap = iIds1.filter(id => iIds2.includes(id));
      
      assert('Tenant 1 and Tenant 2 have no invoice overlap', iOverlap.length === 0,
        iOverlap.length > 0 ? `${iOverlap.length} shared IDs` : '');
    } else {
      skip('Cross-tenant isolation', `No user found for tenant ${tenant2Id}`);
    }
  } else {
    skip('Cross-tenant isolation', 'Only 1 tenant in database');
  }

  // ══════════════════════════════════════════
  //  RESULTS
  // ══════════════════════════════════════════
  console.log(bold('\n═══════════════════════════════════════════════'));
  console.log(bold('  TEST RESULTS'));
  console.log(bold('═══════════════════════════════════════════════'));
  console.log(`  ${green(`✓ Passed: ${passed}`)}`);
  console.log(`  ${failed > 0 ? red(`✗ Failed: ${failed}`) : `  Failed: ${failed}`}`);
  console.log(`  ${skipped > 0 ? yellow(`○ Skipped: ${skipped}`) : `  Skipped: ${skipped}`}`);
  console.log(bold('═══════════════════════════════════════════════'));

  if (failures.length > 0) {
    console.log(red('\nFailed Tests:'));
    failures.forEach((f, i) => {
      console.log(red(`  ${i + 1}. ${f.testName}: ${f.detail}`));
    });
  }

  if (failed === 0) {
    console.log(green('\n🎉 ALL TESTS PASSED! SaaS multi-tenancy is working correctly.\n'));
  } else {
    console.log(red(`\n⚠️  ${failed} test(s) failed. Review the output above.\n`));
  }

  await sequelize.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(red(`\nFatal Error: ${err.message}`));
  console.error(err.stack);
  process.exit(1);
});
