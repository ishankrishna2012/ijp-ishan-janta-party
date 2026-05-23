-- Supabase SQL Schema for IJP - Ishan Janta Party
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/hbxjcfyuwsbsbrjsnynt/sql/new)

-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  codename text not null unique,
  email text not null,
  sector text not null, -- g9, g10, g11, g12
  unique_id text not null unique, -- IJP-YYYY-XXXX
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2. Create Complaints Table
create table if not exists public.complaints (
  id uuid default gen_random_uuid() primary key,
  target_subject text not null,
  transgression_type text not null,
  details text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_unique_id text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'UNDER_INVESTIGATION', 'REDACTED')),
  response text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on complaints
alter table public.complaints enable row level security;

-- 3. Trigger Function for auth.users to public.profiles replication
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, codename, email, sector, unique_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'codename', 'Operative_' || substring(new.id::text, 1, 6)),
    new.email,
    coalesce(new.raw_user_meta_data->>'sector', 'g9'),
    coalesce(new.raw_user_meta_data->>'unique_id', 'IJP-2026-0000'),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute handle_new_user on insert to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Row Level Security Policies

-- Profiles Policies:
-- Allow anyone to read profiles (helpful for looking up unique_id / email mapping during login)
create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

-- Allow users to update their own profile
create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Complaints Policies:
-- Allow students to view their own complaints
create policy "Students can view own complaints"
  on public.complaints for select
  using (auth.uid() = user_id);

-- Allow students to insert their own complaints
create policy "Students can submit complaints"
  on public.complaints for insert
  with check (auth.uid() = user_id);

-- Allow admins to view all complaints
create policy "Admins can view all complaints"
  on public.complaints for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to update complaints (status and response)
create policy "Admins can update complaints"
  on public.complaints for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Seed an Admin User
-- Note: When signing up an admin using Supabase Client, use role='admin' in metadata.
-- Alternatively, manually update a user's role to 'admin' in this table.
