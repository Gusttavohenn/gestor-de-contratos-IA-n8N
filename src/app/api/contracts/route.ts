// src/app/api/contracts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Contract } from '@prisma/client';

// GET p listar tudo o que tem no banco
export async function GET() {
  try {
    // Busca todos os contratos, dos mais novos para os mais antigos
    const contracts: Contract[] = await prisma.contract.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Erro de Infra: Falha ao buscar contratos no SQLite:", error);
    return NextResponse.json({ error: "Erro interno ao listar contratos" }, { status: 500 });
  }
}