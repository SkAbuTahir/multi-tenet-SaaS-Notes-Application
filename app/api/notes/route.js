export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  // Prevent execution during build time
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return Response.json({ error: 'Configuration missing' }, { status: 503 });
  }

  const { getAuthUser } = await import('@/lib/auth');
  const { getPrisma } = await import('@/lib/db');
  
  const prisma = getPrisma();
  
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { tenant: true }
    });

    const notes = await prisma.note.findMany({
      where: { tenantId: userRecord.tenantId },
      include: { createdBy: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return Response.json(notes);
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Prevent execution during build time
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return Response.json({ error: 'Configuration missing' }, { status: 503 });
  }

  const { getAuthUser } = await import('@/lib/auth');
  const { getPrisma } = await import('@/lib/db');
  
  const prisma = getPrisma();
  
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return Response.json({ error: 'Title and content required' }, { status: 400 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { tenant: true }
    });

    // Check note limit for free tenants
    if (userRecord.tenant.plan === 'free') {
      const noteCount = await prisma.note.count({
        where: { tenantId: userRecord.tenantId }
      });

      if (noteCount >= 3) {
        return Response.json({
          error: 'note_limit_reached',
          message: 'Tenant has reached the note limit for Free plan'
        }, { status: 403 });
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tenantId: userRecord.tenantId,
        createdByUserId: user.userId
      },
      include: { createdBy: { select: { email: true } } }
    });

    return Response.json(note, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}