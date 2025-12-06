const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function testPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'netcharge_pro',
    user: 'postgres',
    password: 'ikispa55',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get admin user
    const result = await client.query(`
      SELECT id, email, password, name, role, "isActive"
      FROM users 
      WHERE email = 'admin@netcharge.pro'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      return;
    }

    const user = result.rows[0];
    console.log('\n✅ User found:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);
    console.log('  Password Hash:', user.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log('\n🔐 Password Test:');
    console.log('  Testing password:', testPassword);
    console.log('  Match:', isMatch ? '✅ YES' : '❌ NO');

    if (isMatch) {
      console.log('\n✅ Password is correct! Login should work.');
    } else {
      console.log('\n❌ Password does not match! Need to reset password.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testPassword();
