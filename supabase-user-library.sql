-- ABEE SHORTS: account-ready profile and personal library tables
-- Run in Supabase SQL Editor after enabling Email auth.
create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  film_id bigint not null references public.films(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, film_id)
);
create table if not exists public.user_watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  film_id bigint not null references public.films(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (user_id, film_id)
);
alter table public.user_favorites enable row level security;
alter table public.user_watch_history enable row level security;
drop policy if exists "Users manage own favorites" on public.user_favorites;
create policy "Users manage own favorites" on public.user_favorites
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own watch history" on public.user_watch_history;
create policy "Users manage own watch history" on public.user_watch_history
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.user_favorites to authenticated;
grant select, insert, update, delete on public.user_watch_history to authenticated;
