import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Converte o arquivo da web para bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define o caminho exato para salvar na pasta public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, file.name);

    // Se a pasta uploads não existir, o Node cria ela automaticamente
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Grava o arquivo físico no disco rígido do servidor
    fs.writeFileSync(filePath, buffer);
    // -------------------------------------------------

    // Salva o registro no banco local SQLite
    const contract = await prisma.contract.create({
      data: {
        name: file.name,
        fileName: file.name,
        status: "Analisando"
      } as any
    });
    // 6. Empacota o arquivo físico para enviar ao n8n Cloud
    const n8nFormData = new FormData();
    n8nFormData.append('data', file);
    n8nFormData.append('contractId', contract.id);
    n8nFormData.append('fileName', file.name);

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      // 7. Dispara a requisição para o n8n com o PDF em anexo
      fetch(n8nUrl, {
        method: 'POST',
        body: n8nFormData,
      }).catch(e => console.error("Erro no n8n:", e));
    }

    return NextResponse.json({ success: true, contractId: contract.id });
    
  } catch (error) {
    console.error("Erro na API de Upload:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}