import { Pool } from 'pg'
import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalAny = globalThis as any
const connStr = process.env.DATABASE_URL || ''
const pool = globalAny.__btg_pgPool ?? new Pool({
  connectionString: connStr,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 10000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 5000),
})
globalAny.__btg_pgPool = pool
const adapter = globalAny.__btg_pgAdapter ?? new PrismaPg(pool)
globalAny.__btg_pgAdapter = adapter
const db: PrismaClient = globalAny.__btg_prisma ?? new PrismaClient({ adapter })
globalAny.__btg_prisma = db

export { pool, db }
