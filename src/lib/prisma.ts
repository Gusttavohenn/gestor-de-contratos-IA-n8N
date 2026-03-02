import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql'; 

// 1. O próprio PrismaLibSql recebe a configuração e gerencia a conexão local sozinho
const adapter = new PrismaLibSql({
  url: 'file:./dev.db',
});

// 2. Injeta o adaptador local no PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter, 
    log: ["query"] 
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;