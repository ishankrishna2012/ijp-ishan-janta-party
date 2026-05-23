-- ============================================================
-- Supabase SQL Schema for IJP - Ishan Janta Party (PRODUCTION)
-- Run this in: https://supabase.com/dashboard/project/hbxjcfyuwsbsbrjsnynt/sql/new
-- ============================================================

-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  codename text not null unique,
  email text not null,
  sector text not null default 'g9',
  section text not null default 'A' check (section in ('A','B','C','D','E','F','G','H','I','J')),
  d_no text not null,
  unique_id text not null unique, -- IJP-2026-XXXXX (last 5 digits of D-Number)
  id_card_url text,
  verified boolean not null default false,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Enable realtime on profiles
alter publication supabase_realtime add table public.profiles;

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

-- Enable realtime on complaints
alter publication supabase_realtime add table public.complaints;

-- 3. Trigger Function for auth.users → public.profiles replication
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, codename, email, sector, section, d_no, unique_id, id_card_url, verified, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'codename', 'Operative_' || substring(new.id::text, 1, 6)),
    new.email,
    coalesce(new.raw_user_meta_data->>'sector', 'g9'),
    coalesce(new.raw_user_meta_data->>'section', 'A'),
    coalesce(new.raw_user_meta_data->>'d_no', '00000'),
    coalesce(new.raw_user_meta_data->>'unique_id', 'IJP-2026-00000'),
    new.raw_user_meta_data->>'id_card_url',
    false,
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
-- Allow anyone to read profiles (needed for unique_id / email lookup during login)
create policy "Allow public read access to profiles"
  on public.profiles for select
  using (true);

-- Allow users to update their own profile
create policy "Allow users to update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow admins to update any profile (for verification toggle)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

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

-- ============================================================
-- 5. Storage Bucket for ID Card Uploads
-- ============================================================

-- Create the storage bucket (private)
insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', false)
on conflict (id) do nothing;

-- Storage Policies:

-- Allow authenticated users to upload their own ID card
create policy "Users can upload own ID card"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'id-cards'
  );

-- Allow users to read their own uploaded ID card
create policy "Users can view own ID card"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'id-cards'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Allow admins to read ALL uploaded ID cards
create policy "Admins can view all ID cards"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'id-cards'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 6. Notes
-- ============================================================
-- After signup, manually set role='admin' for admin accounts:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
