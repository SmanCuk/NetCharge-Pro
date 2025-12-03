const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
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

    // Insert admin user
    const query = `
      INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, name, role;
    `;

    const result = await client.query(query, [
      'admin@netcharge.pro',
      hashedPassword,
      'Administrator',
      'admin',
      true
    ]);

    console.log('Admin user created successfully:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin();
