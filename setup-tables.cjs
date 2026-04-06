const { Client } = require('pg');

const client = new Client({
  host: '9bc8pwrr.us-east.database.insforge.app',
  port: 5432,
  database: 'insforge',
  user: 'postgres',
  password: '66aa0a20ccf71cbfb3f61bdee4ee5031',
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        name VARCHAR(255),
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Companies table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'nuevo',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Leads table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        unit VARCHAR(50) DEFAULT 'unidad',
        active BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('CRM Products table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        lead_id UUID,
        product_name VARCHAR(255),
        amount DECIMAL(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pendiente',
        notes TEXT,
        sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('CRM Sales table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        type VARCHAR(20),
        quantity INTEGER DEFAULT 0,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Stock Movements table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        product_id UUID,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);
    console.log('Stock Alerts table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS memory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        type VARCHAR(50),
        title VARCHAR(255),
        content TEXT,
        tags TEXT[],
        active BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Memory Items table created');

    console.log('All CRM tables created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

createTables();
