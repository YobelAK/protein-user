import { Pool } from 'pg'
import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalAny = globalThis as any
const rawStr = process.env.DATABASE_URL || ''
const urlObj = (() => { try { return new URL(rawStr) } catch { return null } })()
if (urlObj) {
  const sp = urlObj.searchParams
  if (!sp.has('pgbouncer')) sp.set('pgbouncer', 'true')
  if (!sp.has('connection_limit')) sp.set('connection_limit', '1')
  urlObj.search = sp.toString()
}
const connStr = urlObj
  ? urlObj.toString()
  : (rawStr.includes('?')
    ? (rawStr.includes('pgbouncer=true') ? (rawStr.includes('connection_limit=') ? rawStr : `${rawStr}&connection_limit=1`) : `${rawStr}&pgbouncer=true&connection_limit=1`)
    : `${rawStr}?pgbouncer=true&connection_limit=1`)
const pool = globalAny.__btg_pgPool ?? new Pool({
  connectionString: connStr,
  max: Number(process.env.PG_POOL_MAX || 1),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 10000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 5000),
})
globalAny.__btg_pgPool = pool
const adapter = globalAny.__btg_pgAdapter ?? new PrismaPg(pool)
globalAny.__btg_pgAdapter = adapter
const db: PrismaClient = globalAny.__btg_prisma ?? new PrismaClient({ adapter })
globalAny.__btg_prisma = db

export { pool, db }
