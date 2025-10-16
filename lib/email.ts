import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@fungi.app',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div>
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error - we show generic success message to user for security
  }
}

