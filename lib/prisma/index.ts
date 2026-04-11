import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// max: 1 est critique en environnement serverless/Next.js pour éviter
// l'épuisement du pool de connexions Supabase (Session mode)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
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