import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    const note = await prisma.note.findFirst({
      where: { 
        id: params.id,
        tenantId: userRecord.tenantId
      },
      include: { createdBy: { select: { email: true } } }
    });

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    return Response.json(note);
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    const existingNote = await prisma.note.findFirst({
      where: { 
        id: params.id,
        tenantId: userRecord.tenantId
      }
    });

    if (!existingNote) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const note = await prisma.note.update({
      where: { id: params.id },
      data: { title, content },
      include: { createdBy: { select: { email: true } } }
    });

    return Response.json(note);
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    const existingNote = await prisma.note.findFirst({
      where: { 
        id: params.id,
        tenantId: userRecord.tenantId
      }
    });

    if (!existingNote) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: params.id }
    });

    return Response.json({ message: 'Note deleted' });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}