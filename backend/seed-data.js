const { Client } = require('pg');

async function seedData() {
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

    // Create 10 customers
    console.log('Creating customers...');
    const customerIds = [];
    for (let i = 1; i <= 10; i++) {
      const result = await client.query(`
        INSERT INTO customers (id, name, email, phone, address, "packageType", "monthlyRate", status, "billingStartDate", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${30 - i * 2} days', NOW() - INTERVAL '${30 - i * 2} days', NOW())
        RETURNING id
      `, [
        `Customer ${i}`,
        `customer${i}@example.com`,
        `08123456${String(i).padStart(3, '0')}`,
        `Address ${i}, Street ${i}, City`,
        i <= 3 ? 'basic' : i <= 7 ? 'standard' : 'premium',
        i <= 3 ? 100000 : i <= 7 ? 250000 : 500000,
        i <= 8 ? 'active' : 'inactive'
      ]);
      customerIds.push(result.rows[0].id);
    }
    console.log(`Created ${customerIds.length} customers`);

    // Create invoices for each customer
    console.log('Creating invoices...');
    let invoiceCount = 0;
    const invoiceIds = [];
    for (const customerId of customerIds) {
      // Create 3 invoices per customer (different months)
      for (let month = 0; month < 3; month++) {
        invoiceCount++;
        const amount = Math.floor(Math.random() * 400000) + 100000;
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() - month);
        dueDate.setDate(15);

        const periodStart = new Date(dueDate);
        periodStart.setDate(1);
        const periodEnd = new Date(dueDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);

        const isPaid = month > 0 || Math.random() > 0.3;
        const status = isPaid ? 'paid' : Math.random() > 0.5 ? 'pending' : 'overdue';

        const result = await client.query(`
          INSERT INTO invoices (id, "invoiceNumber", "customerId", amount, "billingPeriodStart", "billingPeriodEnd", "dueDate", status, description, "paidAmount", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
          RETURNING id
        `, [
          `INV-2024${String(invoiceCount).padStart(4, '0')}`,
          customerId,
          amount,
          periodStart,
          periodEnd,
          dueDate,
          status,
          `Monthly WiFi subscription - ${dueDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
          status === 'paid' ? amount : 0,
          new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days before due date
        ]);
        invoiceIds.push({ id: result.rows[0].id, amount, status });
      }
    }
    console.log(`Created ${invoiceIds.length} invoices`);

    // Create payments for paid invoices
    console.log('Creating payments...');
    let paymentCount = 0;
    const paymentMethods = ['cash', 'bank_transfer', 'qris'];
    for (const invoice of invoiceIds.filter(i => i.status === 'paid')) {
      paymentCount++;
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 60));

      await client.query(`
        INSERT INTO payments (id, "paymentNumber", "invoiceId", amount, method, "transactionId", status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $7)
      `, [
        `PAY-2024${String(paymentCount).padStart(4, '0')}`,
        invoice.id,
        invoice.amount,
        method,
        `TRX-${Date.now()}-${paymentCount}`,
        'completed',
        paymentDate
      ]);
    }
    console.log(`Created ${paymentCount} payments`);

    console.log('\n✅ Seed data completed successfully!');
    console.log(`Summary:`);
    console.log(`- Customers: ${customerIds.length}`);
    console.log(`- Invoices: ${invoiceIds.length}`);
    console.log(`- Payments: ${paymentCount}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

seedData();
