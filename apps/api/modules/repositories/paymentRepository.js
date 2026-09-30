// 10C tenant boundary: all destructive replacement paths must remain tenant-scoped.
// Gate execution covers this repository because it owns payment persistence deletes.
const { getPool } = require('../persistence/supabasePostgres');
const SELECT_COLUMNS = `id, tenant_id, tx_id, booking_code, order_id, amount, status, payment_type, transaction_id, signature_key, raw_response, user_id, payment_method, currency, data, created_at, updated_at`;
function hydrate(row) { const data=row.data&&typeof row.data==='object'?row.data:{}; return { ...data, tenant_id:row.tenant_id, id:data.id||row.tx_id, tx_id:row.tx_id, booking_code:row.booking_code, order_id:row.order_id, amount:row.amount!==null?Number(row.amount):Number(data.amount||0), status:row.status||data.status||'pending', payment_type:row.payment_type||data.payment_type, transaction_id:row.transaction_id||data.transaction_id, signature_key:row.signature_key||data.signature_key, raw_response:row.raw_response||data.raw_response||{}, user_id:row.user_id||data.user_id, payment_method:row.payment_method||data.payment_method, currency:row.currency||data.currency||'IDR', created_at:row.created_at||data.created_at, updated_at:row.updated_at||data.updated_at }; }
async function list(tenantId = null){const p=getPool();if(!p)return[];const r=await p.query(`SELECT ${SELECT_COLUMNS} FROM payment_transactions ${tenantId ? 'WHERE tenant_id = $1' : ''} ORDER BY created_at ASC,id ASC`,tenantId ? [String(tenantId)] : []);return r.rows.map(hydrate);}
async function findById(id, tenantId = null){if(!id)return null;const p=getPool();if(!p)return null;const r=await p.query(`SELECT ${SELECT_COLUMNS} FROM payment_transactions WHERE (tx_id=$1 OR order_id=$1) ${tenantId ? 'AND tenant_id=$2' : ''} LIMIT 1`,tenantId ? [String(id),String(tenantId)] : [String(id)]);return r.rows[0]?hydrate(r.rows[0]):null;}
async function findByTransactionId(txId, tenantId = null){return findById(txId, tenantId);}
async function save(payment){if(!payment||!(payment.tx_id||payment.id))throw new Error('Payment transaction id is required');const p=getPool();if(!p)throw new Error('Supabase PostgreSQL pool is unavailable');const txId=String(payment.tx_id||payment.id);const data={...payment,tx_id:txId};const r=await p.query(`INSERT INTO payment_transactions (tx_id,tenant_id,booking_code,order_id,amount,status,payment_type,transaction_id,signature_key,raw_response,user_id,payment_method,currency,data,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14::jsonb,COALESCE($15::timestamptz,NOW()),NOW()) ON CONFLICT(tx_id) DO UPDATE SET tenant_id=EXCLUDED.tenant_id,booking_code=EXCLUDED.booking_code,order_id=EXCLUDED.order_id,amount=EXCLUDED.amount,status=EXCLUDED.status,payment_type=EXCLUDED.payment_type,transaction_id=EXCLUDED.transaction_id,signature_key=EXCLUDED.signature_key,raw_response=EXCLUDED.raw_response,user_id=EXCLUDED.user_id,payment_method=EXCLUDED.payment_method,currency=EXCLUDED.currency,data=EXCLUDED.data,updated_at=NOW() RETURNING ${SELECT_COLUMNS}`,[txId,String(payment.tenant_id||'tenant_default'),String(payment.booking_code||''),String(payment.order_id||payment.booking_code||txId),Number.isFinite(Number(payment.amount))?Number(payment.amount):0,payment.status||payment.payment_status||'pending',payment.payment_type||null,payment.transaction_id||null,payment.signature_key||null,JSON.stringify(payment.raw_response||{}),payment.user_id?String(payment.user_id):null,payment.payment_method||null,payment.currency||'IDR',JSON.stringify(data),payment.created_at||null]);return hydrate(r.rows[0]);}
async function remove(id, tenantId = null){if(!id)return false;const p=getPool();if(!p)return false;const r=await p.query(`DELETE FROM payment_transactions WHERE (tx_id=$1 OR order_id=$1) ${tenantId ? 'AND tenant_id=$2' : ''}`,tenantId ? [String(id),String(tenantId)] : [String(id)]);return r.rowCount>0;}
async function replaceAll(payments, tenantId){
  if(!tenantId)throw new Error('tenantId is required for payment replaceAll');
  const scopedTenantId=String(tenantId);
  const p=getPool();if(!p)throw new Error('Supabase PostgreSQL pool is unavailable');
  const list=Array.isArray(payments)?payments.filter(x=>x&&(x.tx_id||x.id)):[];
  for(const x of list) {
    if(String(x.tenant_id || scopedTenantId) !== scopedTenantId) {
      throw new Error('Cross-tenant payment replaceAll payload rejected');
    }
    await save({ ...x, tenant_id: scopedTenantId });
  }
  if(list.length) {
    await p.query(
      'DELETE FROM payment_transactions WHERE tenant_id=$1 AND NOT(tx_id=ANY($2::text[]))',
      [scopedTenantId, list.map(x=>String(x.tx_id||x.id))]
    );
  } else {
    await p.query('DELETE FROM payment_transactions WHERE tenant_id=$1', [scopedTenantId]);
  }
}
module.exports={list,findById,findByTransactionId,save,remove,replaceAll};
