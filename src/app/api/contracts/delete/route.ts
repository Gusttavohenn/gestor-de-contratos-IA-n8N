import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const contract: any = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

    if (contract.fileName) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', contract.fileName);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.log("Aviso: PDF físico não encontrado, prosseguindo com exclusão.");
      }
    }

    await prisma.contract.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO FATAL:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}