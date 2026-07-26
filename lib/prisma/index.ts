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

// Le pool ET le client doivent être mis en cache sur globalThis : sans ça, le
// HMR de Turbopack ré-évalue ce module et crée un nouveau Pool à chaque
// rechargement, laissant des connexions orphelines ouvertes sur Supabase.
declare const globalThis: {
    prismaGlobal?: PrismaClient;
    prismaPoolGlobal?: Pool;
} & typeof global;

const createPool = () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: POOL_MAX,

        // Supabase (Supavisor) ferme les connexions inactives de son côté.
        // node-pg ne valide pas une connexion avant de la ressortir du pool :
        // sans ces réglages, il sert un socket mort → Prisma P1017
        // "Server has closed the connection."
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,

        // On recycle avant que le serveur ne le fasse.
        idleTimeoutMillis: 20_000,
        maxLifetimeSeconds: 900, // 15 min

        // Évite d'attendre indéfiniment si le pooler est saturé.
        connectionTimeoutMillis: 10_000,
    })

    // Sans ce handler, une erreur sur un client *inactif* (coupure réseau,
    // veille de la machine) remonte en exception non gérée et tue le process.
    // Le pool retire de lui-même le client fautif.
    pool.on('error', (error) => {
        console.error('[prisma] Erreur sur une connexion inactive du pool :', error.message)
    })

    return pool
}

const pool = globalThis.prismaPoolGlobal ?? createPool()

const prisma = globalThis.prismaGlobal ?? new PrismaClient({ adapter: new PrismaPg(pool) })

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaPoolGlobal = pool
    globalThis.prismaGlobal = prisma
}

export default prisma
