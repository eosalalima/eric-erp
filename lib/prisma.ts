// lib/prisma.ts
// Use the generated Prisma client located in lib/generated/prisma
import { PrismaClient } from './generated/prisma'
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma


// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ['query', 'error', 'warn'],
//   })

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

