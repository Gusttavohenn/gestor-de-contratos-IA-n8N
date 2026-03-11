import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do contrato não fornecido" }, { status: 400 });
    }

    // Only include fields that were actually sent
    const data: Record<string, string | null> = {};
    const allowedFields = ['name', 'company', 'category', 'renewal', 'manager', 'validityDate', 'cnpj', 'contact', 'value', 'monthlyValue'];
    for (const field of allowedFields) {
      if (field in fields) {
        data[field] = fields[field] ?? null;
      }
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: data as any,
    });

    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (error) {
    console.error("Erro ao editar contrato:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
