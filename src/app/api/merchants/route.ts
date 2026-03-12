import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
        })
        return NextResponse.json({ merchants })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
    }
}
