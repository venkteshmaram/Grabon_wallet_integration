import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, phone } = await request.json()

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                name,
                phone,
                passwordHash,
            },
        })

        await prisma.wallet.create({
            data: {
                userId: user.id,
                availableBalance: 0,
                pendingBalance: 0,
                lockedBalance: 0,
                lifetimeEarned: 0,
            },
        })

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    } catch (error) {
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
