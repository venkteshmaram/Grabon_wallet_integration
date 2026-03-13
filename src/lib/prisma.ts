import { PrismaClient } from '@prisma/client/index'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

let prismaInstance: PrismaClient

function getPrisma() {
    if (prismaInstance) return prismaInstance

    if (connectionString) {
        const pool = new Pool({ connectionString })
        const adapter = new PrismaPg(pool as any)
        prismaInstance = new PrismaClient({ adapter })
    } else {
        prismaInstance = new PrismaClient()
    }
    return prismaInstance
}

export const prisma = getPrisma()
