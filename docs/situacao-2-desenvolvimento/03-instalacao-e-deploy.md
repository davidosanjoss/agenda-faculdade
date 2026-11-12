# Instalação e publicação

## Rodar localmente

Requisitos: Node.js 22 ou superior, Docker e Supabase CLI (a versão fica em `.tool-versions`).

```bash
git clone git@github.com:davidosanjoss/agenda-faculdade.git
cd agenda-faculdade
npm install
supabase start        # sobe Postgres, Auth e Storage locais e aplica supabase/migrations
```

Crie o `.env.local` a partir do `.env.example`, usando os valores de `supabase status`:

| Variável | Valor em `supabase status` |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (só para os testes de integração) |

```bash
node --env-file=.env.local scripts/dados-exemplo.mjs   # cria a conta de demonstração com ~5 meses de dados
npm run dev                                            # http://localhost:3000
```

Para dar acesso ao laudo, torne a conta administradora:

```bash
docker exec supabase_db_agenda-mei psql -U postgres -c \
  "insert into administradores select id from auth.users where email = 'demo@agenda.local'"
```

## Publicar (Supabase + Vercel)

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito) e aplique as migrations:
   ```bash
   supabase link --project-ref <ref-do-projeto>
   supabase db push
   ```
2. Em **Authentication → URL Configuration**, configure:
   - **Site URL**: `https://<seu-app>.vercel.app`
   - **Redirect URLs**: `https://<seu-app>.vercel.app/auth/callback`
3. Na [Vercel](https://vercel.com), importe o repositório do GitHub e cadastre as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   Não cadastre `SUPABASE_SECRET_KEY` na Vercel: a aplicação não precisa dela.
4. Faça o deploy. A cada push na `main`, a Vercel publica uma nova versão.
5. Crie a sua conta no sistema publicado e torne-a administradora pelo **SQL Editor** do Supabase:
   ```sql
   insert into administradores select id from auth.users where email = 'seu@email.com';
   ```
