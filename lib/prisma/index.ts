import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Taille du pool de connexions.
//
// max: 1 reste le défaut sûr en serverless (Vercel) avec une connexion directe
// ou le pooler en mode "session" : chaque instance ne garde qu'une connexion,
// ce qui évite l'épuisement du pool Supabase.
//
// PERF : avec une seule connexion, toutes les requêtes Prisma se sérialisent
// (les Promise.all ne parallélisent rien côté DB). Pour les débloquer :
//   1. pointer DATABASE_URL vers le pooler Supabase en mode transaction
//      (port 6543, `?pgbouncer=true`) ;
//   2. définir DATABASE_POOL_MAX (ex. 10).
// Ne PAS augmenter max sans le pooler transaction → "too many connections".
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX) || 1

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: POOL_MAX,
})

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma