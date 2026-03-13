// @ts-ignore - PrismaClient is generated but IDE recognition is failing in this environment
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const prismaClientSingleton = () => {
    if (connectionString) {
        const pool = new Pool({
            connectionString,
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        })

        pool.on('error', (err) => {
            console.error('[Prisma] pool error:', err)
        })

        const adapter = new PrismaPg(pool as any)
        return new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        })
    }
    
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
}

const g = global as any;

export const prisma = g.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    g.prismaGlobal = prisma
}
