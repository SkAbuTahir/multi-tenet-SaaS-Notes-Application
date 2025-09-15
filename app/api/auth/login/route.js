export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Dynamic imports to avoid build-time issues
    const { prisma } = await import('@/lib/db');
    const { verifyPassword, signToken } = await import('@/lib/auth');

    if (!prisma) {
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
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