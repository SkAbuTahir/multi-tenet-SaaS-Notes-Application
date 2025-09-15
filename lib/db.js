import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
  } catch (error) {
    console.warn('Prisma client initialization failed:', error.message);
    prisma = null;
  }
}

export { prisma };