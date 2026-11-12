-- Avaliações dos testadores (PIT II, Situação 3) e laudo de qualidade.

-- Quem pode ler todas as avaliações e registrar as correções (o desenvolvedor).
-- Inclusão manual pelo SQL Editor; não há acesso pela API.
create table public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.administradores enable row level security;
revoke all on public.administradores from anon, authenticated;
grant all on public.administradores to service_role;

create function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.administradores where user_id = (select auth.uid()))
$$;
revoke execute on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  testador text not null check (length(trim(testador)) > 0),
  data_teste date not null default current_date,
  funcionou text,
  nao_funcionou text,
  nao_testado text,
  sugestoes text,
  prints text[] not null default '{}' check (cardinality(prints) <= 5),
  navegador text,
  situacao text not null default 'pendente' check (situacao in ('pendente', 'corrigido', 'nao_procede')),
  correcao text,
  created_at timestamptz not null default now(),
  constraint feedback_nao_vazio check (
    length(trim(coalesce(funcionou, '') || coalesce(nao_funcionou, '') || coalesce(nao_testado, '') || coalesce(sugestoes, ''))) > 0
  )
);
create index feedbacks_created_idx on public.feedbacks (created_at);

alter table public.feedbacks enable row level security;
revoke all on public.feedbacks from anon;
grant all on public.feedbacks to service_role;
grant select, insert on public.feedbacks to authenticated;
-- O testador não edita; o administrador só atualiza a situação e a correção.
grant update (situacao, correcao) on public.feedbacks to authenticated;

create policy "testador envia avaliacao" on public.feedbacks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and situacao = 'pendente'
    and correcao is null
    and (select bool_and(p like (select auth.uid())::text || '/%') from unnest(prints) p) is not false
  );

create policy "testador ve as suas, admin ve todas" on public.feedbacks
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.eh_admin()));

create policy "admin registra correcao" on public.feedbacks
  for update to authenticated
  using ((select public.eh_admin()))
  with check ((select public.eh_admin()));

-- Prints das telas: bucket privado, uma pasta por usuário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prints', 'prints', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "testador envia prints na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prints' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "dono e admin veem prints" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'prints'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.eh_admin()))
  );
