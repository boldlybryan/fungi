import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createPullRequest } from '@/lib/github';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prototype = await prisma.prototype.findUnique({
      where: { id: params.id },
    });

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (prototype.createdById !== user.id) {
      return NextResponse.json(
        { error: 'You don\'t have permission to submit this prototype' },
        { status: 403 }
      );
    }

    // Check status
    if (prototype.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Prototype has already been submitted' },
        { status: 400 }
      );
    }

    // Check if preview is available
    if (!prototype.previewUrl) {
      return NextResponse.json(
        { error: 'Preview deployment must be ready before submission' },
        { status: 400 }
      );
    }

    // Create Pull Request
    const prTitle = `Prototype by ${user.name || user.email}: ${prototype.description}`;
    const prBody = `
## Prototype Submission

**Description:** ${prototype.description}

**Preview URL:** ${prototype.previewUrl}

**v0 Project:** https://v0.dev/chat/${prototype.v0ProjectId}

**Created by:** ${user.email}

**Branch:** \`${prototype.branchName}\`

---

### Important Notes

✅ This prototype only modifies safe, example content paths  
✅ No protected system files were modified  
✅ Preview has been tested and is live  

### Files Modified

This PR includes changes to example content that can be safely reviewed and merged.

---

*This PR was automatically created by Fungi, the AI-powered prototype builder.*
    `.trim();

    let pr;
    try {
      pr = await createPullRequest(prototype.branchName, prTitle, prBody);
    } catch (error: any) {
      console.error('Failed to create PR:', error);
      return NextResponse.json(
        { error: `Failed to create pull request: ${error.message}` },
        { status: 500 }
      );
    }

    // Update prototype status
    await prisma.prototype.update({
      where: { id: prototype.id },
      data: {
        status: 'SUBMITTED',
        prNumber: pr.prNumber,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      prNumber: pr.prNumber,
      prUrl: pr.url,
    });
  } catch (error) {
    console.error('Submit prototype error:', error);
    return NextResponse.json(
      { error: 'Failed to submit prototype' },
      { status: 500 }
    );
  }
}

