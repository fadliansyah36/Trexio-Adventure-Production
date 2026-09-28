/**
 * Apply Mission 08 booking/payment relational cutover explicitly.
 * Transactional and idempotent: legacy app_* tables are preserved.
 */
require('dotenv').config();
const fs=require('fs');
const path=require('path');
const {getPool}=require('../src/db/supabasePostgres');

const BASELINE='20260829000000_V3_trexio_migration.sql';
const MIGRATION='20260929010000_MISSION_08_booking_payment_relational_cutover.sql';

async function main(){
  const pool=getPool();
  if(!pool) throw new Error('DATABASE_URL is not configured');
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('trexio:mission08:booking-payment'))");

    const baseline=path.join(__dirname,'..','supabase','migrations',BASELINE);
    const migration=path.join(__dirname,'..','supabase','migrations',MIGRATION);
    const t=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('bookings','payment_transactions','app_bookings','app_payments')");
    const set=new Set(t.rows.map(r=>r.table_name));
    if(!set.has('bookings')||!set.has('payment_transactions')||!set.has('app_bookings')||!set.has('app_payments')){
      console.log('[Mission 08] Applying V3 baseline because booking/payment baseline is incomplete');
      await client.query(fs.readFileSync(baseline,'utf8'));
    }
    const sql=fs.readFileSync(migration,'utf8');
    console.log('[Mission 08] Applying '+MIGRATION);
    await client.query(sql);
    const c=await client.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND ((table_name='bookings' AND column_name IN ('external_id','data')) OR (table_name='payment_transactions' AND column_name IN ('data','user_id','payment_method','currency')))");
    const got=new Set(c.rows.map(r=>r.table_name+'.'+r.column_name));
    for(const expected of ['bookings.external_id','bookings.data','payment_transactions.data','payment_transactions.user_id','payment_transactions.payment_method','payment_transactions.currency']){
      if(!got.has(expected)) throw new Error('Post-migration verification failed: missing '+expected);
    }
    await client.query('COMMIT');
    console.log('[Mission 08] Migration applied and schema verification passed.');
  }catch(err){
    await client.query('ROLLBACK');
    console.error('[Mission 08] Migration failed; transaction rolled back.');
    throw err;
  }finally{client.release();await pool.end();}
}
main().catch(err=>{console.error('[Mission 08] ERROR:',err.message);process.exit(1);});
