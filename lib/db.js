// import { PrismaClient } from '@prisma/client';

// const globalForPrisma = globalThis;

// export function getPrisma() {
//   if (globalForPrisma.prisma) {
//     return globalForPrisma.prisma;
//   }
  
//   const prisma = new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   });
  
//   if (process.env.NODE_ENV !== 'production') {
//     globalForPrisma.prisma = prisma;
//   }
  
//   return prisma;
// }




// lib/db.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
