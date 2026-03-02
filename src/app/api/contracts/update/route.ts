import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    const { id, aiSummary, status, name, validityDate, cnpj, contact, value, monthlyValue } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do contrato não fornecido" }, { status: 400 });
    }

    const updatedContract = await prisma.contract.update({
      where: { id: id },
      data: { 
        aiSummary: aiSummary,
        status: status || "Ativo",
        name: name,
        validityDate: validityDate,
        cnpj: cnpj,
        contact: contact,
        value: value,
        monthlyValue: monthlyValue
      } as any
    });

    return NextResponse.json({ success: true, contract: updatedContract });
  } catch (error) {
    console.error("Erro ao atualizar contrato com resumo da IA:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}