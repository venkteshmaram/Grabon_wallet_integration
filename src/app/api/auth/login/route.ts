// ============================================
// LOGIN API ROUTE - Step 7 Auth Hardening
// POST /api/auth/login - Authenticate user and return JWT
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// ============================================
// REQUEST VALIDATION SCHEMA (Step 7)
// ============================================

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginRequest = z.infer<typeof loginSchema>;

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
// POST HANDLER - Login
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse and validate request body (Step 7: Zod validation)
        const body = await request.json();
        const validationResult = loginSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((e) => e.message).join(', ');
            return createErrorResponse(
                `Validation failed: ${errors}`,
                'VALIDATION_ERROR',
                400
            );
        }

        const { email, password } = validationResult.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Step 7: Same error for user not found or wrong password (prevents user enumeration)
        if (!user) {
            return createErrorResponse(
                'Invalid credentials',
                'INVALID_CREDENTIALS',
                401
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
            return createErrorResponse(
                'Invalid credentials',
                'INVALID_CREDENTIALS',
                401
            );
        }

        // Step 7: Check JWT_SECRET is configured (no fallback secret)
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
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse(
            'Login failed',
            'LOGIN_FAILED',
            500
        );
    }
}
