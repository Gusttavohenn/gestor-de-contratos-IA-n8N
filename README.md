# Minas Port Docs

Sistema de gestao de contratos com analise automatizada por IA. Faz upload de PDFs de contratos, extrai dados automaticamente via n8n + IA e organiza tudo em um painel de controle.

## Stack

- **Next.js 16** (App Router) + React 19
- **Prisma ORM** + SQLite (via libsql)
- **Tailwind CSS 4**
- **Lucide React** (icones)
- **n8n** (webhook para processamento de IA)

## Pre-requisitos

- [Node.js](https://nodejs.org/) v18+
- npm (vem com o Node)

## Instalacao

```bash
# 1. Clone o repositorio
git clone <url-do-repo>
cd minas-port-docs

# 2. Instale as dependencias
npm install

# 3. Configure as variaveis de ambiente
cp .env.example .env
```

Edite o `.env` com suas configuracoes:

```env
# URL do banco SQLite (local)
DATABASE_URL="file:./dev.db"

# Webhook do n8n para processamento de IA
N8N_WEBHOOK_URL="https://seu-n8n.app.n8n.cloud/webhook/seu-webhook-id"
```

```bash
# 4. Gere o cliente Prisma e crie o banco
npx prisma generate
npx prisma db push

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
minas-port-docs/
├── prisma/
│   └── schema.prisma          # Modelos do banco (Contract, Category, Manager)
├── public/
│   └── uploads/               # PDFs enviados ficam aqui
├── src/
│   ├── app/
│   │   ├── page.tsx           # Interface principal (SPA com abas)
│   │   └── api/
│   │       ├── upload/        # POST - Upload de PDFs + envio ao n8n
│   │       ├── contracts/
│   │       │   ├── update/    # POST - Callback do n8n com dados extraidos
│   │       │   ├── edit/      # PATCH - Edicao manual de campos
│   │       │   └── delete/    # DELETE - Remover contrato
│   │       ├── download/      # GET - Download do PDF original
│   │       ├── categories/    # GET/POST/DELETE - CRUD de categorias
│   │       └── managers/      # GET/POST/DELETE - CRUD de gestores
│   └── lib/
│       └── prisma.ts          # Instancia do Prisma Client
├── package.json
└── .env
```

## Funcionalidades

### Painel
- Cards com metricas (total de contratos, valor acumulado, vigentes, vencendo)
- Distribuicao por categoria e por empresa (graficos de barra)

### Analisar Contrato
- Upload de PDF (unitario ou multiplo)
- Selecao de empresa e gestor no envio
- Processamento automatico via n8n + IA

### Base de Contratos
- Listagem com paginacao (10 por pagina)
- Busca por nome, empresa, CNPJ, gestor, categoria
- Filtro por empresa e por status (Vigente, Vence em Breve, Renovavel, Expirado, Analisando)
- Ordenacao por nome, empresa, valor, vigencia
- Edicao manual de todos os campos
- Visualizacao e download do PDF original
- Exclusao de contratos

### Cadastros
- Gerenciamento de categorias
- Gerenciamento de gestores

## Fluxo de Processamento

```
Upload PDF -> Salva no banco (status: "Analisando")
           -> Envia PDF ao n8n webhook
           -> n8n processa com IA (extrai nome, CNPJ, vigencia, valores...)
           -> n8n chama /api/contracts/update com os dados extraidos
           -> Contrato atualizado no banco (status: "Ativo")
```

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm run start` | Inicia build de producao |
| `npx prisma studio` | Interface visual do banco |
| `npx prisma db push` | Sincroniza schema com o banco |
| `npx prisma generate` | Regenera o Prisma Client |

## Banco de Dados

### Contract
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| name | String | Nome do contrato (extraido pela IA) |
| fileName | String | Nome do arquivo PDF |
| status | String | "Analisando" ou "Ativo" |
| aiSummary | String? | Resumo gerado pela IA |
| validityDate | String? | Data de vigencia |
| cnpj | String? | CNPJ da empresa |
| contact | String? | Contato |
| value | String? | Valor total |
| monthlyValue | String? | Valor mensal |
| company | String? | Empresa do grupo |
| category | String? | Categoria do contrato |
| renewal | String? | Tipo de renovacao |
| manager | String? | Gestor responsavel |

### Category / Manager
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| name | String | Nome (unico) |
