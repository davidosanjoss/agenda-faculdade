-- Agenda MEI: clientes, serviços e agendamentos.
-- Cada profissional (usuário do Supabase Auth) só enxerga os próprios dados (RLS).

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  telefone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  valor numeric(10, 2) not null default 0 check (valor >= 0),
  created_at timestamptz not null default now()
);

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  servico text not null check (length(trim(servico)) > 0),
  valor numeric(10, 2) not null check (valor >= 0),
  data date not null,
  hora time not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'realizado', 'faltou', 'cancelado')),
  obs text,
  created_at timestamptz not null default now()
);

create index clientes_user_nome_idx on public.clientes (user_id, lower(nome));
create index servicos_user_nome_idx on public.servicos (user_id, lower(nome));
create index agendamentos_user_data_idx on public.agendamentos (user_id, data, hora);
create index agendamentos_cliente_idx on public.agendamentos (cliente_id);

-- Só usuários logados acessam as tabelas; o RLS abaixo limita às linhas de cada um.
revoke all on public.clientes, public.servicos, public.agendamentos from anon;
grant select, insert, update, delete on public.clientes, public.servicos, public.agendamentos to authenticated;

alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.agendamentos enable row level security;

create policy "dono gerencia clientes" on public.clientes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "dono gerencia servicos" on public.servicos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "dono gerencia agendamentos" on public.agendamentos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.clientes c
      where c.id = cliente_id and c.user_id = (select auth.uid())
    )
  );
