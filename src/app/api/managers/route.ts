import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const managers = await prisma.manager.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(managers);
  } catch (error) {
    console.error("Erro ao buscar gestores:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do gestor é obrigatório" }, { status: 400 });
    }
    const manager = await prisma.manager.create({
      data: { name: name.trim() } as any,
    });
    return NextResponse.json(manager);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Gestor já existe" }, { status: 409 });
    }
    console.error("Erro ao criar gestor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await prisma.manager.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar gestor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
