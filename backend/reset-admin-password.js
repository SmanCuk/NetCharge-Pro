const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdminPassword() {
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

    // Generate bcrypt hash
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated password hash:', hashedPassword);

    // Update admin password
    const query = `
      UPDATE users 
      SET password = $1, "updatedAt" = NOW()
      WHERE email = $2
      RETURNING id, email, name, role, "isActive";
    `;

    const result = await client.query(query, [
      hashedPassword,
      'admin@netcharge.pro'
    ]);

    if (result.rows.length === 0) {
      console.error('Admin user not found!');
    } else {
      console.log('Admin password reset successfully:', result.rows[0]);
      console.log('\nLogin credentials:');
      console.log('Email: admin@netcharge.pro');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
