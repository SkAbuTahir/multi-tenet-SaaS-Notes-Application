export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  // Check environment variables
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    return Response.json({ 
      error: 'Configuration missing',
      hasDB: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET
    }, { status: 503 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Dynamic imports to avoid build-time issues
    const { getPrisma } = await import('@/lib/db');
    const { verifyPassword, signToken } = await import('@/lib/auth');

    const prisma = getPrisma();

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
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}