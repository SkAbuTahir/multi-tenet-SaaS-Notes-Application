import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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
    const tenant = await prisma.tenant.update({
      where: { slug: params.slug },
      data: { plan: 'pro' }
    });

    return Response.json({ message: 'Tenant upgraded to Pro plan', tenant });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}