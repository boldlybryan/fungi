import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/db';
import { signIn } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    // Find reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > passwordReset.expiresAt) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hash(password, 12);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    // Auto-login after password reset
    await signIn('credentials', {
      email: passwordReset.user.email,
      password,
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred during password reset' },
      { status: 500 }
    );
  }
}

