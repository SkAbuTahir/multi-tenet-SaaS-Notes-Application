import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user || !verifyPassword(password, user.password)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      tenantSlug: user.tenant.slug,
      role: user.role
    });

    return Response.json({ token });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}