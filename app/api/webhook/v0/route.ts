import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateFilePaths } from '@/lib/protected-paths';
import { commitFiles } from '@/lib/github';

export async function POST(request: Request) {
  try {
    // In production, verify webhook signature/token here
    const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.V0_WEBHOOK_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const payload = await request.json();
    
    // Expected payload structure (adjust based on actual v0 API):
    // {
    //   v0ProjectId: string,
    //   files: Array<{ path: string, content: string }>,
    //   message?: string
    // }
    
    const { v0ProjectId, files, message } = payload;

    if (!v0ProjectId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Find the prototype by v0 project ID
    const prototype = await prisma.prototype.findFirst({
      where: { v0ProjectId },
      include: { createdBy: true },
    });

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      );
    }

    // Validate that all files are not in protected paths
    const validation = validateFilePaths(files);
    
    if (!validation.valid) {
      // Log security event
      console.error('Protected path modification attempt:', {
        prototypeId: prototype.id,
        userId: prototype.createdById,
        attemptedPaths: validation.invalidPaths,
      });

      return NextResponse.json(
        {
          error: 'Protected path modification not allowed',
          message: `Cannot modify protected files: ${validation.invalidPaths.join(', ')}`,
          hint: 'You can modify: landing page (/app/page.tsx), example pages (/app/examples/), example components (/components/examples/)',
        },
        { status: 403 }
      );
    }

    // Commit files to GitHub branch
    const commitMessage = message || `[v0] Update from AI assistant - ${new Date().toISOString()}`;
    
    try {
      await commitFiles(prototype.branchName, files, commitMessage);
    } catch (error: any) {
      console.error('Failed to commit files:', error);
      return NextResponse.json(
        { error: 'Failed to commit changes to GitHub' },
        { status: 500 }
      );
    }

    // Update prototype updated timestamp
    await prisma.prototype.update({
      where: { id: prototype.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Changes committed successfully',
    });
  } catch (error) {
    console.error('v0 webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

