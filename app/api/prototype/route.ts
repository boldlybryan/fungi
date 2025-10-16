import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search');

    const where: any = {
      createdById: user.id,
    };

    if (filter && filter !== 'ALL') {
      where.status = filter;
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const prototypes = await prisma.prototype.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(prototypes);
  } catch (error) {
    console.error('Get prototypes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prototypes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await request.json();

    // Validation
    if (!description || description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const branchName = `prototype-${user.id.substring(0, 8)}-${timestamp}`;

    let createdBranch = false;
    let createdDbBranch = false;
    let neonBranchId = '';

    try {
      // Step 1: Create GitHub branch
      const { createBranch } = await import('@/lib/github');
      await createBranch(branchName);
      createdBranch = true;

      // Step 2: Create Neon database branch
      const { createDatabaseBranch } = await import('@/lib/neon');
      const { branchId, connectionString } = await createDatabaseBranch(branchName);
      createdDbBranch = true;
      neonBranchId = branchId;

      // Step 3: Set Vercel environment variable
      const { setEnvironmentVariable } = await import('@/lib/vercel');
      await setEnvironmentVariable(branchName, 'DATABASE_URL', connectionString);

      // Step 4: Create prototype record
      const prototype = await prisma.prototype.create({
        data: {
          description,
          branchName,
          v0ProjectId: `temp-${timestamp}`, // Will be updated in Phase 4
          status: 'IN_PROGRESS',
          createdById: user.id,
          previewDatabase: {
            create: {
              branchName,
              neonBranchId: branchId,
              connectionString,
            },
          },
        },
      });

      console.log(`Created prototype ${prototype.id} with branch ${branchName}`);
      
      return NextResponse.json(prototype, { status: 201 });
    } catch (error: any) {
      console.error('Create prototype error:', error);

      // Rollback on failure
      if (createdDbBranch && neonBranchId) {
        const { deleteDatabaseBranch } = await import('@/lib/neon');
        await deleteDatabaseBranch(neonBranchId);
      }
      if (createdBranch) {
        const { deleteBranch } = await import('@/lib/github');
        await deleteBranch(branchName);
      }

      return NextResponse.json(
        { 
          error: error.message || 'Failed to create prototype',
          step: !createdBranch ? 'GitHub' : !createdDbBranch ? 'Database' : 'Vercel'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Create prototype error:', error);
    return NextResponse.json(
      { error: 'Failed to create prototype' },
      { status: 500 }
    );
  }
}

