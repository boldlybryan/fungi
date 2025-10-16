import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prototype = await prisma.prototype.findUnique({
      where: {
        id: params.id,
      },
      include: {
        previewDatabase: true,
      },
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
        { error: 'You don\'t have permission to access this prototype' },
        { status: 403 }
      );
    }

    return NextResponse.json(prototype);
  } catch (error) {
    console.error('Get prototype error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prototype' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prototype = await prisma.prototype.findUnique({
      where: {
        id: params.id,
      },
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
        { error: 'You don\'t have permission to delete this prototype' },
        { status: 403 }
      );
    }

    // Prevent deletion of submitted or merged prototypes
    if (prototype.status === 'SUBMITTED' || prototype.status === 'MERGED') {
      return NextResponse.json(
        { error: 'Cannot delete submitted or merged prototypes' },
        { status: 400 }
      );
    }

    // Soft delete - update status to ARCHIVED
    await prisma.prototype.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete prototype error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prototype' },
      { status: 500 }
    );
  }
}

