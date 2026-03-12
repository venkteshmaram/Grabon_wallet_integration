// ============================================
// REGISTER API ROUTE - Step 7 Auth Hardening
// POST /api/auth/register - Create new user account
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// ============================================
// REQUEST VALIDATION SCHEMA (Step 7)
// ============================================

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/\d/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number format')
        .optional(),
});

type RegisterRequest = z.infer<typeof registerSchema>;

// ============================================
// ERROR RESPONSE HELPER
// ============================================

function createErrorResponse(message: string, code: string, status: number = 400) {
    return NextResponse.json(
        {
            error: {
                message,
                code,
            },
        },
        { status }
    );
}

// ============================================
// POST HANDLER - Register
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse and validate request body (Step 7: Zod validation)
        const body = await request.json();
        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { email, password, name, phone } = validationResult.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return createErrorResponse(
                'User with this email already exists',
                'USER_EXISTS',
                409
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with wallet
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                phone,
                wallet: {
                    create: {
                        availableBalance: 0,
                        pendingBalance: 0,
                        lockedBalance: 0,
                        lifetimeEarned: 0,
                    },
                },
            },
        });

        // Step 7: Check JWT_SECRET is configured (no fallback)
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return createErrorResponse(
                'Server configuration error',
                'SERVER_ERROR',
                500
            );
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            jwtSecret,
            { expiresIn: (process.env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'] }
        );

        // Step 7: Password is never returned
        return NextResponse.json(
            {
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return createErrorResponse(
            'Registration failed',
            'REGISTER_FAILED',
            500
        );
    }
}
