import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
(async ()=>{
  try{
    if(process.env.DATABASE_URL){
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl:{ rejectUnauthorized:false } });
      await pool.query(`INSERT INTO vendors (id,name) VALUES ('v1','Demo Vendor') ON CONFLICT DO NOTHING`);
      await pool.query(`INSERT INTO products (id,vendor_id,title,price) VALUES ('p1','v1','Demo T-shirt',29) ON CONFLICT DO NOTHING`);
      await pool.end();
      console.log('Postgres seeded');
    }
  }catch(e){ console.warn('Postgres seed failed', e.message) }
  try{
    if(process.env.MONGODB_URI){
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db();
      await db.collection('vendors').updateOne({id:'v1'},{$set:{name:'Demo Vendor'}},{upsert:true});
      await db.collection('products').updateOne({id:'p1'},{$set:{vendor_id:'v1',title:'Demo T-shirt',price:29}},{upsert:true});
      await client.close();
      console.log('Mongo seeded');
    }
  }catch(e){ console.warn('Mongo seed failed', e.message) }
})();
