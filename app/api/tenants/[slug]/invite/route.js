export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function POST(request, { params }) {
  const user = getAuthUser(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (user.tenantSlug !== params.slug) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return Response.json({ error: 'Email and role required' }, { status: 400 });
    }

    if (!['admin', 'member'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.slug }
    });

    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashPassword('password'),
        role,
        tenantId: tenant.id
      }
    });

    return Response.json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}