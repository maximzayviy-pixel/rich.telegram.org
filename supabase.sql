create table if not exists public.users (
  tg_id bigint primary key,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists public.deposits (
  id bigserial primary key,
  tg_id bigint references public.users(tg_id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

create table if not exists public.withdrawals (
  id bigserial primary key,
  tg_id bigint references public.users(tg_id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

create or replace view public.v_user_balances as
select u.tg_id,
       coalesce((select sum(d.amount) from public.deposits d where d.tg_id = u.tg_id),0) as total_deposited,
       coalesce((select sum(w.amount) from public.withdrawals w where w.tg_id = u.tg_id),0) as total_withdrawn,
       coalesce((select sum(d.amount) from public.deposits d where d.tg_id = u.tg_id and d.created_at <= now() - interval '21 days'),0) -
       coalesce((select sum(w.amount) from public.withdrawals w where w.tg_id = u.tg_id),0) as withdrawable,
       (coalesce((select sum(d.amount) from public.deposits d where d.tg_id = u.tg_id),0) -
        coalesce((select sum(w.amount) from public.withdrawals w where w.tg_id = u.tg_id),0)) as current_balance
from public.users u;

alter table public.users enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;

create policy if not exists "read_users_public" on public.users for select using (true);
create policy if not exists "read_deposits_public" on public.deposits for select using (true);
create policy if not exists "read_withdrawals_public" on public.withdrawals for select using (true);

grant select on public.users, public.deposits, public.withdrawals to anon;
revoke insert, update, delete on public.users, public.deposits, public.withdrawals from anon;

grant select on public.v_user_balances to anon;
