const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const testAccounts = [
  { email: 'admin@acme.test', password: 'password', tenant: 'acme', role: 'admin' },
  { email: 'user@acme.test', password: 'password', tenant: 'acme', role: 'member' },
  { email: 'admin@globex.test', password: 'password', tenant: 'globex', role: 'admin' },
  { email: 'user@globex.test', password: 'password', tenant: 'globex', role: 'member' }
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function test(name, fn) {
  try {
    console.log(`🧪 ${name}`);
    await fn();
    console.log(`✅ ${name} - PASSED\n`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    process.exit(1);
  }
}

async function login(email, password) {
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
  
  return response.data.token;
}

async function runTests() {
  console.log('🚀 Starting Multi-Tenant Notes SaaS Tests\n');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  // Test 1: Health Check
  await test('Health endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status !== 200 || response.data.status !== 'ok') {
      throw new Error(`Expected 200 with status 'ok', got ${response.status}: ${JSON.stringify(response.data)}`);
    }
  });

  // Test 2: Login with all test accounts
  const tokens = {};
  for (const account of testAccounts) {
    await test(`Login ${account.email}`, async () => {
      const token = await login(account.email, account.password);
      tokens[account.email] = token;
      
      // Verify token contains expected payload
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.email !== account.email || payload.role !== account.role) {
        throw new Error(`Token payload mismatch for ${account.email}`);
      }
    });
  }

  // Test 3: Tenant isolation
  await test('Tenant isolation', async () => {
    const acmeToken = tokens['admin@acme.test'];
    const globexToken = tokens['admin@globex.test'];

    // Create note in Acme
    const createResponse = await makeRequest(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${acmeToken}`
      },
      body: JSON.stringify({ title: 'Acme Secret', content: 'Top secret Acme content' })
    });

    if (createResponse.status !== 201) {
      throw new Error(`Failed to create note: ${JSON.stringify(createResponse.data)}`);
    }

    const noteId = createResponse.data.id;

    // Try to access Acme note from Globex
    const accessResponse = await makeRequest(`${BASE_URL}/api/notes/${noteId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${globexToken}` }
    });

    if (accessResponse.status !== 404) {
      throw new Error(`Expected 404 for cross-tenant access, got ${accessResponse.status}`);
    }

    // Verify Globex can't see Acme notes in list
    const listResponse = await makeRequest(`${BASE_URL}/api/notes`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${globexToken}` }
    });

    if (listResponse.status !== 200) {
      throw new Error(`Failed to list notes: ${JSON.stringify(listResponse.data)}`);
    }

    const globexNotes = listResponse.data;
    const hasAcmeNote = globexNotes.some(note => note.id === noteId);
    if (hasAcmeNote) {
      throw new Error('Globex can see Acme notes - tenant isolation failed');
    }
  });

  // Test 4: Role enforcement
  await test('Role enforcement', async () => {
    const memberToken = tokens['user@acme.test'];

    // Try to invite user (admin only)
    const inviteResponse = await makeRequest(`${BASE_URL}/api/tenants/acme/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken}`
      },
      body: JSON.stringify({ email: 'test@acme.test', role: 'member' })
    });

    if (inviteResponse.status !== 403) {
      throw new Error(`Expected 403 for member trying to invite, got ${inviteResponse.status}`);
    }

    // Try to upgrade (admin only)
    const upgradeResponse = await makeRequest(`${BASE_URL}/api/tenants/acme/upgrade`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });

    if (upgradeResponse.status !== 403) {
      throw new Error(`Expected 403 for member trying to upgrade, got ${upgradeResponse.status}`);
    }
  });

  // Test 5: Free plan note limit and upgrade
  await test('Free plan limit and upgrade', async () => {
    const adminToken = tokens['admin@globex.test'];

    // Create 3 notes (should succeed)
    for (let i = 1; i <= 3; i++) {
      const response = await makeRequest(`${BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ title: `Note ${i}`, content: `Content ${i}` })
      });

      if (response.status !== 201) {
        throw new Error(`Failed to create note ${i}: ${JSON.stringify(response.data)}`);
      }
    }

    // Try to create 4th note (should fail)
    const limitResponse = await makeRequest(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: 'Note 4', content: 'Content 4' })
    });

    if (limitResponse.status !== 403 || limitResponse.data.error !== 'note_limit_reached') {
      throw new Error(`Expected 403 with note_limit_reached, got ${limitResponse.status}: ${JSON.stringify(limitResponse.data)}`);
    }

    // Upgrade to Pro
    const upgradeResponse = await makeRequest(`${BASE_URL}/api/tenants/globex/upgrade`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (upgradeResponse.status !== 200) {
      throw new Error(`Failed to upgrade: ${JSON.stringify(upgradeResponse.data)}`);
    }

    // Now 4th note should succeed
    const postUpgradeResponse = await makeRequest(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: 'Note 4', content: 'Content 4' })
    });

    if (postUpgradeResponse.status !== 201) {
      throw new Error(`Failed to create note after upgrade: ${JSON.stringify(postUpgradeResponse.data)}`);
    }
  });

  // Test 6: CRUD operations
  await test('Notes CRUD operations', async () => {
    const token = tokens['user@acme.test'];

    // Create
    const createResponse = await makeRequest(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'CRUD Test', content: 'Original content' })
    });

    if (createResponse.status !== 201) {
      throw new Error(`Create failed: ${JSON.stringify(createResponse.data)}`);
    }

    const noteId = createResponse.data.id;

    // Read
    const readResponse = await makeRequest(`${BASE_URL}/api/notes/${noteId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (readResponse.status !== 200 || readResponse.data.title !== 'CRUD Test') {
      throw new Error(`Read failed: ${JSON.stringify(readResponse.data)}`);
    }

    // Update
    const updateResponse = await makeRequest(`${BASE_URL}/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'CRUD Test Updated', content: 'Updated content' })
    });

    if (updateResponse.status !== 200 || updateResponse.data.title !== 'CRUD Test Updated') {
      throw new Error(`Update failed: ${JSON.stringify(updateResponse.data)}`);
    }

    // Delete
    const deleteResponse = await makeRequest(`${BASE_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (deleteResponse.status !== 200) {
      throw new Error(`Delete failed: ${JSON.stringify(deleteResponse.data)}`);
    }

    // Verify deletion
    const verifyResponse = await makeRequest(`${BASE_URL}/api/notes/${noteId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (verifyResponse.status !== 404) {
      throw new Error(`Note still exists after deletion`);
    }
  });

  // Test 7: Frontend accessibility
  await test('Frontend accessibility', async () => {
    const response = await makeRequest(FRONTEND_URL);
    if (response.status !== 200) {
      throw new Error(`Frontend not accessible: ${response.status}`);
    }
  });

  console.log('🎉 All tests passed! The Multi-Tenant Notes SaaS is working correctly.');
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});