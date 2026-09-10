const jwt = require('jsonwebtoken');
const { User, Role, DocumentType, StaffDocument } = require('./models');

const API_BASE = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_123456';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(`Request failed: ${res.status} ${res.statusText}`);
    error.data = data;
    throw error;
  }
  return data;
}

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Staff Profile & Documents Integration Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Find an admin user for tenant 1
  const adminUser = await User.findOne({
    where: { tenant_id: 1 },
    include: [{ model: Role, where: { name: 'Admin' } }]
  });

  if (!adminUser) {
    throw new Error('Admin user for tenant 1 not found');
  }

  const token = jwt.sign(
    { id: adminUser.id, tenant_id: 1, role_id: adminUser.role_id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Ensure a DocumentType exists for testing
  let docType = await DocumentType.findOne({ where: { tenant_id: 1 } });
  if (!docType) {
    docType = await DocumentType.create({
      name: 'Emirates ID',
      category: 'Personal Document',
      is_active: true,
      tenant_id: 1
    });
  }

  // 2. Create a test staff user
  const testStaffEmail = `staff_test_${Date.now()}@example.com`;
  console.log('1. Creating test staff member...');
  const createRes = await request('/users', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Ahmed Al Mansoori',
      email: testStaffEmail,
      password: 'Password123!',
      role_id: adminUser.role_id,
      phone: '+971 50 123 4567',
      address: 'Flat 402, Al Nahda 2, Dubai, UAE',
      home_country_address: '123 River Road, Cairo, Egypt',
      home_country_contact: '+20 10 9876 5432',
      home_country_alternate_contact: '+20 12 3456 7890',
      designation: 'Senior Typist & PRO',
      joining_date: '2024-01-15',
      basic_salary: 3500,
      hr_allowance: 1500,
      other_allowances: 500
    })
  });

  const staff = createRes.data;
  console.log(`  ✓ Staff created: ${staff.name} (ID: ${staff.id})`);
  console.log(`    Total salary computed: AED ${staff.total_salary} (Expected: 5500)`);
  if (parseFloat(staff.total_salary) !== 5500) {
    throw new Error(`Total salary mismatch! Expected 5500, got ${staff.total_salary}`);
  }

  // 3. Test GET /users/:id
  console.log('\n2. Fetching staff details via GET /users/:id...');
  const getRes = await request(`/users/${staff.id}`, {
    headers: authHeaders
  });
  const fetchedStaff = getRes.data;
  console.log(`  ✓ Retrieved staff: ${fetchedStaff.name}`);
  console.log(`    Local Contact: ${fetchedStaff.phone}, Address: ${fetchedStaff.address}`);
  console.log(`    Home Country Contact: ${fetchedStaff.home_country_contact}, Alt: ${fetchedStaff.home_country_alternate_contact}`);
  console.log(`    Designation: ${fetchedStaff.designation}, Joining Date: ${fetchedStaff.joining_date}`);

  // 4. Test PUT /users/:id
  console.log('\n3. Updating staff salary and contact details...');
  const updateRes = await request(`/users/${staff.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Ahmed Al Mansoori (Promoted)',
      basic_salary: 4000,
      hr_allowance: 2000,
      other_allowances: 500,
      phone: '+971 55 999 8888'
    })
  });
  const updatedStaff = updateRes.data;
  console.log(`  ✓ Updated staff total salary: AED ${updatedStaff.total_salary} (Expected: 6500)`);
  console.log(`  ✓ Updated phone: ${updatedStaff.phone}`);
  if (parseFloat(updatedStaff.total_salary) !== 6500) {
    throw new Error(`Updated total salary mismatch! Expected 6500, got ${updatedStaff.total_salary}`);
  }

  // 5. Test adding Staff Document
  console.log('\n4. Adding staff document...');
  const addDocRes = await request(`/users/${staff.id}/documents`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      document_type_id: docType.id,
      title: 'Staff Emirates ID',
      doc_number: '784-1990-1234567-1',
      issue_date: '2024-01-01',
      expiry_date: '2026-12-31',
      notes: 'Renewed upon employment visa issuance'
    })
  });
  const doc = addDocRes.data;
  console.log(`  ✓ Document added (ID: ${doc.id}): ${doc.title} (#${doc.doc_number})`);
  console.log(`    Expiry Date: ${doc.expiry_date}, Type: ${doc.DocumentType?.name}`);

  // 6. Test GET /users/:id with documents included
  console.log('\n5. Verifying staff profile includes the newly added document...');
  const getWithDocs = await request(`/users/${staff.id}`, { headers: authHeaders });
  const staffDocs = getWithDocs.data.StaffDocuments;
  console.log(`  ✓ StaffDocuments count: ${staffDocs.length}`);
  if (staffDocs.length !== 1 || staffDocs[0].id !== doc.id) {
    throw new Error('Staff documents array mismatch');
  }

  // 7. Test updating Staff Document
  console.log('\n6. Updating staff document...');
  const updateDocRes = await request(`/users/${staff.id}/documents/${doc.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      doc_number: '784-1990-1234567-9',
      notes: 'Updated document number'
    })
  });
  console.log(`  ✓ Document updated doc_number: ${updateDocRes.data.doc_number}`);

  // 8. Test deleting Staff Document
  console.log('\n7. Deleting staff document...');
  const deleteDocRes = await request(`/users/${staff.id}/documents/${doc.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log(`  ✓ ${deleteDocRes.message}`);

  // 9. Cleanup test staff
  console.log('\n8. Cleaning up test staff user...');
  await request(`/users/${staff.id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('  ✓ Test staff user deleted successfully.');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  🎉 ALL STAFF BACKEND TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err.data || err.message);
  process.exit(1);
});
