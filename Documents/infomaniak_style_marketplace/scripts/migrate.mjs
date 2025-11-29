    import { Pool } from 'pg';
    const sql = `CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, name TEXT, created_at TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, vendor_id TEXT, title TEXT, price NUMERIC, created_at TIMESTAMP DEFAULT now());
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data JSONB, created_at TIMESTAMP DEFAULT now());
`;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    async function run(){ try{ await pool.query(sql); console.log('Postgres migrate ok') }catch(e){ console.error(e); process.exit(1) } finally{ await pool.end() } }
    run();
