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

## Publicação e versionamento dos deploys

Produção: https://agenda-mei.vercel.app, com o Supabase `agenda-mei` (região São Paulo) e o projeto `agenda-mei` da Vercel ligado ao repositório do GitHub.

Cada versão publicada corresponde a um commit na `main`:

```
push na main ──► GitHub Actions (CI)
                  ├─ qualidade: lint, tipos, testes de unidade, build
                  ├─ integracao-e-sistema: Supabase local, integração, Playwright
                  └─ migrations-producao (só se os dois passarem): supabase db push
             └──► Vercel: build e publicação do commit (Production)
pull request ──► Vercel: deploy de Preview com URL própria + CI
```

- **Aplicação**: a Vercel cria um deploy imutável por commit. O histórico fica em *Deployments*, e qualquer versão anterior pode voltar a ser a de produção com *Instant Rollback*.
- **Banco**: cada mudança de esquema é um arquivo em `supabase/migrations/` (versionado no Git). O job `migrations-producao` aplica só as migrations novas, registradas em `supabase_migrations.schema_migrations`. O histórico de execuções aparece no GitHub em *Environments → producao*.
- As migrations precisam ser **compatíveis com a versão anterior** do código (por exemplo, adicionar coluna antes de usá-la), porque a Vercel e o job do banco rodam em paralelo.

### Configuração (feita uma vez)

1. **Supabase**, em *Authentication → URL Configuration*:
   - **Site URL**: `https://<app>.vercel.app`
   - **Redirect URLs**: `https://<app>.vercel.app/**` e `https://*-daviribeirodosanjos-projects.vercel.app/**` (previews)
2. **Vercel**: projeto importado do GitHub, com as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Não cadastre `SUPABASE_SECRET_KEY`.
3. **GitHub**, em *Settings → Environments → producao*:
   - variable `SUPABASE_PROJECT_REF`: id do projeto Supabase
   - secret `SUPABASE_ACCESS_TOKEN`: token criado em supabase.com → *Account → Access Tokens*
   - secret `SUPABASE_DB_PASSWORD`: senha do banco (*Project Settings → Database*)
4. Crie a sua conta no sistema publicado e torne-a administradora pelo **SQL Editor** do Supabase:
   ```sql
   insert into administradores select id from auth.users where email = 'seu@email.com';
   ```
