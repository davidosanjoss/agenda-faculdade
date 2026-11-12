# Agenda MEI

Agenda e previsão de faturamento para profissionais autônomos de atendimento, como manicures, cabeleireiros e fisioterapeutas. Projeto de extensão ligado ao **ODS 8, meta 8.3**: apoio a microempreendedores e à formalização de pequenos negócios.

## O que faz

- **Agenda semanal**: cadastra o cliente (nome, telefone e e-mail opcional), o serviço e o valor. Cliente ou serviço novo é cadastrado automaticamente.
- **Situação de cada atendimento**: agendado, realizado, faltou ou cancelado. Atendimentos passados que continuam como "agendado" aparecem em destaque para receber baixa.
- **Lembrete pelo WhatsApp**: um botão abre a conversa com a mensagem do horário já escrita.
- **Financeiro**: mostra a previsão do mês (realizado + agendado), o que já foi realizado, o que falta receber, o valor perdido com faltas e cancelamentos e o ticket médio. Tem gráfico e tabela comparando os últimos 6 meses.
- **Clientes**: total gasto, número de atendimentos, faltas e data do último atendimento.
- **Login**: cada profissional vê só os próprios dados, garantido por RLS no Postgres.

Stack: Next.js 16 (App Router, Server Actions), shadcn/ui, Tailwind 4, Supabase (Auth + Postgres) e Vercel.

## Rodar localmente

Requisitos: Node 20+, Docker e Supabase CLI (a versão está em `.tool-versions`).

```bash
npm install
supabase start          # sobe o Postgres e o Auth locais e aplica supabase/migrations
# .env.local já aponta para o Supabase local (porta 55321)
node --env-file=.env.local scripts/dados-exemplo.mjs   # usuário demo@agenda.local / demo123
npm run dev             # http://localhost:3000
```

Para conferir se um usuário não acessa os dados de outro: `node --env-file=.env.local scripts/testar-rls.mjs`.

## Publicar (Supabase + Vercel)

1. Crie um projeto em https://supabase.com e aplique a migration:
   ```bash
   supabase link --project-ref <ref-do-projeto>
   supabase db push
   ```
2. No Supabase, em **Authentication → URL Configuration**:
   - **Site URL**: `https://<seu-app>.vercel.app`
   - **Redirect URLs**: `https://<seu-app>.vercel.app/auth/callback`
3. Na Vercel, importe o repositório e configure as variáveis (veja `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY` da integração Supabase da Vercel também funciona)
4. Faça o deploy. Novas contas recebem um e-mail de confirmação antes do primeiro acesso.
