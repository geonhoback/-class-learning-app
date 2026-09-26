-- ============================================================
-- 우리 반 학습공간 - Supabase 스키마 + RLS 정책
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- ============================================================

-- 1) 확장 기능 (uuid 생성용)
create extension if not exists "pgcrypto";

-- ============================================================
-- 2) 테이블 생성
-- ============================================================

-- 사용자 프로필 (Supabase Auth 사용자와 1:1 연결)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '이름 없음',
  role text not null default 'student' check (role in ('admin','teacher','student')),
  created_at timestamptz not null default now()
);

-- 일정 (수행평가 / 지필고사 / 숙제 / 공지 / 학사일정 / 기타)
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('task','exam','homework','notice','school','etc')),
  subject text,
  title text not null,
  description text,
  date date not null,
  start_time time,
  end_time time,
  location text,
  attachment_url text,
  -- 반복 일정 확장을 위한 자리 (1차 버전에서는 사용하지 않음)
  repeat_rule text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 공지사항
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_important boolean not null default false,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 학습자료 (노트필기 / 유인물 / 기타 학습자료)
create table if not exists study_materials (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('note','worksheet','study')),
  subject text,
  title text not null,
  description text,
  file_url text,
  file_type text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 자주 쓰는 조회 조건에 인덱스
create index if not exists idx_schedules_date on schedules(date);
create index if not exists idx_notices_important on notices(is_important);
create index if not exists idx_materials_subject on study_materials(subject);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_schedules_updated on schedules;
create trigger trg_schedules_updated before update on schedules
  for each row execute function set_updated_at();

drop trigger if exists trg_notices_updated on notices;
create trigger trg_notices_updated before update on notices
  for each row execute function set_updated_at();

-- ============================================================
-- 3) 회원가입 시 profiles 자동 생성 (기본 role = student)
--    관리자로 지정할 계정은 가입 후 이 표에서 role을 'admin' 또는 'teacher'로
--    직접 바꿔주세요 (Table Editor에서 수정하면 됩니다).
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '이름 없음'), 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 4) 관리자 여부 확인 헬퍼 함수 (RLS 정책에서 재사용)
-- ============================================================
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin','teacher')
  );
$$ language sql security definer stable;

-- ============================================================
-- 5) Row Level Security 활성화
-- ============================================================
alter table profiles enable row level security;
alter table schedules enable row level security;
alter table notices enable row level security;
alter table study_materials enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- ---- schedules : 누구나(학생 포함, 로그인 없이도) 읽기 가능 ----
drop policy if exists "schedules_select_all" on schedules;
create policy "schedules_select_all" on schedules
  for select using (true);

drop policy if exists "schedules_admin_insert" on schedules;
create policy "schedules_admin_insert" on schedules
  for insert with check (is_admin());

drop policy if exists "schedules_admin_update" on schedules;
create policy "schedules_admin_update" on schedules
  for update using (is_admin()) with check (is_admin());

drop policy if exists "schedules_admin_delete" on schedules;
create policy "schedules_admin_delete" on schedules
  for delete using (is_admin());

-- ---- notices ----
drop policy if exists "notices_select_all" on notices;
create policy "notices_select_all" on notices
  for select using (true);

drop policy if exists "notices_admin_insert" on notices;
create policy "notices_admin_insert" on notices
  for insert with check (is_admin());

drop policy if exists "notices_admin_update" on notices;
create policy "notices_admin_update" on notices
  for update using (is_admin()) with check (is_admin());

drop policy if exists "notices_admin_delete" on notices;
create policy "notices_admin_delete" on notices
  for delete using (is_admin());

-- ---- study_materials ----
drop policy if exists "materials_select_all" on study_materials;
create policy "materials_select_all" on study_materials
  for select using (true);

drop policy if exists "materials_admin_insert" on study_materials;
create policy "materials_admin_insert" on study_materials
  for insert with check (is_admin());

drop policy if exists "materials_admin_update" on study_materials;
create policy "materials_admin_update" on study_materials
  for update using (is_admin()) with check (is_admin());

drop policy if exists "materials_admin_delete" on study_materials;
create policy "materials_admin_delete" on study_materials
  for delete using (is_admin());

-- ============================================================
-- 6) Storage 버킷 + 정책
--    버킷은 대시보드 Storage 메뉴에서 만든 뒤 아래 정책을 적용하세요.
--    (버킷 이름: study-materials, attachments / 둘 다 Public 버킷으로 생성)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('study-materials','study-materials', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('attachments','attachments', true)
  on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('study-materials','attachments'));

drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert" on storage.objects
  for insert with check (
    bucket_id in ('study-materials','attachments') and is_admin()
  );

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update using (
    bucket_id in ('study-materials','attachments') and is_admin()
  );

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete using (
    bucket_id in ('study-materials','attachments') and is_admin()
  );

-- ============================================================
-- 7) 테스트용 샘플 데이터 (선택 사항 - 화면 확인용)
--    실제 서비스 전에는 삭제하거나 주석 처리하세요.
-- ============================================================
insert into schedules (category, subject, title, description, date)
values
  ('task','과학','과학 수행평가','교과서 78~95쪽, 실험 보고서 형식으로 정리', current_date + 4),
  ('exam','수학','수학 지필고사','1~3단원 전체, 서술형 3문항 포함', current_date + 5),
  ('homework','영어','영어 숙제','workbook 34~36쪽', current_date + 1),
  ('notice',null,'준비물 안내','체육 시간에 체육복을 챙겨오세요.', current_date + 2),
  ('school',null,'체험학습','과학관 체험학습, 도시락 지참', current_date + 9)
on conflict do nothing;

insert into notices (title, content, is_important)
values
  ('2학기 중간고사 안내','시험은 10월 셋째 주에 진행됩니다.', true),
  ('분리수거 당번 교체','이번 주 분리수거 당번이 2분단으로 변경되었습니다.', false)
on conflict do nothing;
