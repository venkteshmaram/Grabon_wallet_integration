import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
        })
        // Keep both keys for backward compatibility across pages/hooks
        return NextResponse.json({
            data: merchants,
            merchants,
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
    }
}
