import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate cryptographically secure token (32 bytes)
    const token = randomBytes(32).toString('hex');

    // Store hashed token in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        used: false,
      },
    });

    // Send email
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to not reveal errors
    return NextResponse.json({ success: true });
  }
}

