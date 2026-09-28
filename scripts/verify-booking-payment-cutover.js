/**
 * Read-only parity verification for Mission 08 Booking/Payment cutover.
 * Run immediately after migration, before new writes make legacy copies diverge.
 */
require('dotenv').config();
const {getPool}=require('../src/db/supabasePostgres');

function norm(v){if(v===null||v===undefined)return null;if(typeof v==='object')return JSON.stringify(v);return String(v);}
function mapLegacy(row){const d=row.data||{};return {id:d.id||row.id,booking_code:d.booking_code,total_amount:Number(d.total_amount||0),payment_status:d.payment_status||'pending',booking_status:d.booking_status||'pending_payment',user_id:d.user_id??null,trip_id:d.trip_id??null,vendor_id:d.vendor_id??null};}
function mapRel(row){const d=row.data||{};return {id:row.external_id||String(row.id),booking_code:row.booking_code,total_amount:Number(row.total_amount||0),payment_status:row.payment_status||'pending',booking_status:row.booking_status||'pending_payment',user_id:d.user_id??row.user_id,trip_id:d.trip_id??row.trip_id,vendor_id:d.vendor_id??row.vendor_id};}
function compare(legacy,rel,map){const l=new Map(legacy.map(x=>{const m=map(x);return[m.id,m];}));const r=new Map(rel.map(x=>{const m=map(x);return[m.id,m];}));const missing=[],extra=[],changed=[];for(const [id,x] of l){if(!r.has(id))missing.push(id);else{const y=r.get(id);const diffs=Object.keys(x).filter(k=>norm(x[k])!==norm(y[k]));if(diffs.length)changed.push({id,fields:diffs});}}for(const id of r.keys())if(!l.has(id))extra.push(id);return{missing,extra,changed};}
async function main(){
 const p=getPool();if(!p)throw new Error('DATABASE_URL is not configured');
 try{
  const [lb,rb,lp,rp]=await Promise.all([
   p.query("SELECT id,data FROM app_bookings ORDER BY id"),
   p.query("SELECT id,external_id,booking_code,user_id,vendor_id,trip_id,total_amount,payment_status,booking_status,data FROM bookings ORDER BY id"),
   p.query("SELECT id,data FROM app_payments ORDER BY id"),
   p.query("SELECT id,tx_id,booking_code,order_id,amount,status,payment_type,transaction_id,signature_key,raw_response,user_id,payment_method,currency,data FROM payment_transactions ORDER BY id")
  ]);
  const bookings=compare(lb.rows,rb.rows,mapLegacy);const payments=compare(lp.rows,rp.rows,
   row=>{const d=row.data||{};return{ id:d.tx_id||d.payment_id||row.tx_id||row.id,booking_code:d.booking_code||row.booking_code,order_id:d.order_id||row.order_id,amount:Number(d.amount||row.amount||0),status:d.status||d.payment_status||row.status,payment_type:d.payment_type||row.payment_type,transaction_id:d.transaction_id||row.transaction_id};});
  console.log(JSON.stringify({legacy:{bookings:lb.rowCount,payments:lp.rowCount},relational:{bookings:rb.rowCount,payments:rp.rowCount},bookings,payments},null,2));
  if(bookings.missing.length||bookings.extra.length||bookings.changed.length||payments.missing.length||payments.extra.length||payments.changed.length) process.exitCode=1;
  else console.log('[Mission 08] PASSED — Booking and Payment relational rows match legacy core fields.');
 }finally{await p.end();}
}
main().catch(e=>{console.error('[Mission 08] ERROR:',e.message);process.exit(1);});
