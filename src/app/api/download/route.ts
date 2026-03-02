import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }
// Busca o contrato no banco de dados e silencia o TypeScript
    const contract: any = await prisma.contract.findUnique({
      where: { id: id }
    });

    // Verificar pelo fileName
    if (!contract || !contract.fileName) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }
    // Monta o caminho exato de onde salvamos o PDF fisicamente
    const filePath = path.join(process.cwd(), 'public', 'uploads', contract.fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        error: "Ficheiro físico não encontrado no servidor",
        caminhoBuscado: filePath
      }, { status: 404 });
    }

    // Lê o arquivo e devolve para o navegador baixar
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contract.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erro na API de Download:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}