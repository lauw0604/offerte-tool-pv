create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  brand text,
  description text not null,
  unit text not null,
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  vat_rate numeric(4,2) not null default 0,
  watt_peak numeric,
  capacity_kwh numeric,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  postal_code text,
  city text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offertes (
  id uuid primary key default gen_random_uuid(),
  offer_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  valid_until date not null,
  status text not null default 'concept' check (status in ('concept','verstuurd','geaccepteerd','afgewezen')),
  roof_orientation text,
  roof_pitch numeric,
  panel_count integer,
  estimated_yearly_output_kwh numeric,
  discount_amount numeric(12,2) not null default 0,
  intro_text text,
  created_by uuid,
  split_invoices boolean not null default false
);

create table if not exists public.offerte_regels (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offertes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  vat_rate numeric(4,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  company_address text,
  postal_code text,
  city text,
  phone text,
  email text,
  default_installation_hourly_rate numeric(12,2) default 0,
  default_payment_terms text,
  default_warranty_text text,
  default_pvgis_value numeric(12,2) default 875,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.offertes enable row level security;
alter table public.offerte_regels enable row level security;
alter table public.settings enable row level security;

create policy "authenticated users can read products" on public.products for select using (auth.role() = 'authenticated');
create policy "authenticated users can edit products" on public.products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated users can read customers" on public.customers for select using (auth.role() = 'authenticated');
create policy "authenticated users can edit customers" on public.customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated users can read offertes" on public.offertes for select using (auth.role() = 'authenticated');
create policy "authenticated users can edit offertes" on public.offertes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated users can read offerte regels" on public.offerte_regels for select using (auth.role() = 'authenticated');
create policy "authenticated users can edit offerte regels" on public.offerte_regels for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated users can read settings" on public.settings for select using (auth.role() = 'authenticated');
create policy "authenticated users can edit settings" on public.settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger customers_updated_at before update on public.customers for each row execute function public.update_updated_at_column();
create trigger settings_updated_at before update on public.settings for each row execute function public.update_updated_at_column();

-- Teams table for team-based access control
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team members table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique(team_id, user_id)
);

-- Add team_id column to offertes if not exists
alter table public.offertes add column if not exists team_id uuid references public.teams(id) on delete set null;

-- Enable RLS on new tables
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- RLS policies for teams
create policy "users can read teams they are members of" on public.teams for select using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = teams.id
    and tm.user_id = auth.uid()
  )
  or owner_id = auth.uid()
);

create policy "team owners can edit their team" on public.teams for all using (
  owner_id = auth.uid()
) with check (
  owner_id = auth.uid()
);

-- RLS policies for team members
create policy "users can read team members of their teams" on public.team_members for select using (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and (t.owner_id = auth.uid() or t.id in (
      select team_id from public.team_members tm2
      where tm2.user_id = auth.uid()
    ))
  )
);

create policy "team owners can manage members" on public.team_members for all using (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and t.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id
    and t.owner_id = auth.uid()
  )
);

-- Update RLS policies for offertes to include team access
create policy "users can read offertes from their teams" on public.offertes for select using (
  team_id in (
    select team_id from public.team_members
    where user_id = auth.uid()
  )
  or team_id is null and auth.role() = 'authenticated'
) with check (true);

create policy "users can edit offertes in their teams" on public.offertes for all using (
  team_id in (
    select team_id from public.team_members
    where user_id = auth.uid()
  )
  or team_id is null and auth.role() = 'authenticated'
) with check (
  team_id in (
    select team_id from public.team_members
    where user_id = auth.uid()
  )
  or team_id is null and auth.role() = 'authenticated'
);

-- Triggers for teams and team_members
create trigger teams_updated_at before update on public.teams for each row execute function public.update_updated_at_column();
