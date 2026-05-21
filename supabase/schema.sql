-- ============================================================================
-- 100x Hub — Learning Platform  (powered by Velozity Global Solutions)
-- Supabase / PostgreSQL schema  ·  course-centric LMS, 2 user types
-- ----------------------------------------------------------------------------
-- DATA MODEL
--   admins           — controllers of the platform.
--   allowed_students — emails an admin has approved for signup (the gate).
--   students         — learners who have signed up. Each is assigned ONE
--                      course; suspended students lose all access. XP /
--                      streaks / activity power the gamification.
--   No instructors, no other roles.
--
-- HOW TO APPLY
--   Supabase Dashboard → SQL Editor → paste this whole file → Run.
--   IDEMPOTENT and NON-DESTRUCTIVE — re-running keeps all data, adds anything
--   new, and self-heals (auto-confirms accounts, back-fills missing rows).
--
--   Admin login:  admin@eduhub.com  /  Admin@12345   (login at /admin/login)
--
--   ALSO in the Supabase dashboard:
--     - Authentication → Sign In/Providers → Email → turn OFF "Confirm email"
--       (the allowlist is the gate; students can sign in immediately).
--     - Authentication → Sign In/Providers → enable the Google provider, so
--       students can sign up / in with Google.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Remove tables from the original cohort-based schema (safe if already gone).
drop table if exists public.progress      cascade;
drop table if exists public.enrollments   cascade;
drop table if exists public.cohorts       cascade;
drop table if exists public.organizations cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.is_instructor()      cascade;

-- `profiles` was a TABLE in the old cohort schema; this schema now exposes it
-- as a VIEW (created near the end). Drop it only when it's still a base table,
-- so re-running this file doesn't choke on the existing view.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
      and table_type = 'BASE TABLE'
  ) then
    drop table public.profiles cascade;
  end if;
end;
$$;

-- ============================================================================
-- HELPER — auto-maintain `updated_at`
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- CORE TABLES  (create-if-not-exists — existing data preserved)
-- ============================================================================
create table if not exists public.admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text not null default 'Administrator',
  created_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  duration_weeks integer not null default 8,
  order_index    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.students (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text not null default '',
  course_id   uuid references public.courses (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ALLOWLIST — admin-approved emails (the gate for self-signup)
-- ----------------------------------------------------------------------------
-- There is NO open sign-up. An admin adds a student's email here first; only
-- then can that person create an account — with Google OR email + password.
-- The handle_new_user() trigger enforces this; see AUTH TRIGGERS below.
create table if not exists public.allowed_students (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text not null default '',
  course_id   uuid references public.courses (id) on delete set null,
  batch       text,
  added_by    uuid references auth.users (id) on delete set null,
  claimed_by  uuid references auth.users (id) on delete set null,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now()
);
-- One allowlist entry per email, matched case-insensitively.
create unique index if not exists idx_allowed_students_email
  on public.allowed_students (lower(email));

-- Lesson groupings within a course.
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null,
  description text,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  description  text,
  content      text,
  is_published boolean not null default false,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.lesson_resources (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  title         text not null,
  resource_type text not null default 'link'
                check (resource_type in ('pdf', 'document', 'presentation', 'code', 'video', 'link')),
  file_url      text,
  created_at    timestamptz not null default now()
);

create table if not exists public.assignments (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses (id) on delete cascade,
  title            text not null,
  description      text,
  instructions     text,
  due_date         timestamptz,
  points_possible  integer not null default 100,
  is_published     boolean not null default false,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  content       text,
  submitted_at  timestamptz not null default now(),
  points_earned integer,
  feedback      text,
  graded_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- Quizzes — questions is a jsonb array of { question, options:[text], correct:int }.
create table if not exists public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  lesson_id    uuid references public.lessons (id) on delete set null,
  title        text not null,
  description  text,
  questions    jsonb not null default '[]'::jsonb,
  xp_reward    integer not null default 20,
  is_published boolean not null default false,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  student_id   uuid not null references public.students (id) on delete cascade,
  answers      jsonb not null default '[]'::jsonb,
  score        integer not null default 0,
  total        integer not null default 0,
  completed_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

-- ============================================================================
-- COLUMN UPGRADES  (add-if-not-exists — safe on existing databases)
-- ============================================================================
alter table public.students    add column if not exists status         text not null default 'active';
alter table public.students    add column if not exists xp             integer not null default 0;
alter table public.students    add column if not exists streak         integer not null default 0;
alter table public.students    add column if not exists longest_streak integer not null default 0;
alter table public.students    add column if not exists last_active_at timestamptz;
alter table public.students    add column if not exists last_login_at  timestamptz;
-- Profile / onboarding (Phase B)
alter table public.students    add column if not exists bio                  text;
alter table public.students    add column if not exists avatar_url           text;
alter table public.students    add column if not exists country              text;
alter table public.students    add column if not exists timezone             text;
alter table public.students    add column if not exists domain               text;
alter table public.students    add column if not exists experience_level     text;
alter table public.students    add column if not exists goal                 text;
alter table public.students    add column if not exists weekly_commitment     text;
alter table public.students    add column if not exists daily_goal            integer not null default 30;
alter table public.students    add column if not exists onboarding_completed  boolean not null default false;
-- Admin annotations (Phase C)
alter table public.students    add column if not exists admin_notes          text;
alter table public.students    add column if not exists tags                 text[] not null default '{}';
-- Admin-controlled onboarding / invite flow (Phase D)
alter table public.students    add column if not exists batch                text;
alter table public.students    add column if not exists role                 text not null default 'student';

alter table public.submissions add column if not exists status      text not null default 'submitted';
alter table public.submissions add column if not exists xp_awarded  integer not null default 0;
alter table public.submissions add column if not exists link_url    text;

alter table public.lessons     add column if not exists video_url    text;
alter table public.lessons     add column if not exists module_id    uuid references public.modules (id) on delete set null;
alter table public.lessons     add column if not exists scheduled_at timestamptz;

alter table public.students    drop constraint if exists students_status_check;
alter table public.students    add  constraint students_status_check
  check (status in ('active', 'suspended'));
alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add  constraint submissions_status_check
  check (status in ('submitted', 'approved', 'rejected'));

-- ============================================================================
-- GAMIFICATION & TRACKING TABLES
-- ============================================================================
create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  type       text not null,
  detail     jsonb not null default '{}'::jsonb,
  xp_delta   integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  type         text not null default 'info',
  title        text not null,
  body         text,
  link         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  title       text not null,
  description text,
  icon        text not null default 'award',
  xp_threshold integer
);

create table if not exists public.student_achievements (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at      timestamptz not null default now(),
  unique (student_id, achievement_id)
);

-- Calendar / planner. Admin events (owner_student_id NULL) are course-wide and
-- seen by every student on that course; student events are private to them.
create table if not exists public.calendar_events (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid references public.courses (id) on delete cascade,
  owner_student_id uuid references public.students (id) on delete cascade,
  created_by       uuid,
  title            text not null,
  description      text,
  event_type       text not null default 'class'
                   check (event_type in ('class', 'task', 'session', 'deadline', 'personal')),
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- COURSE PLAYGROUND — realtime per-course messaging used during live classes.
-- Admins broadcast tasks/announcements, students chat, both see updates over
-- Supabase Realtime. `course_task_completions` records who marked a task done.
-- ----------------------------------------------------------------------------
create table if not exists public.course_messages (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  sender_id   uuid not null references auth.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('admin', 'student')),
  sender_name text,
  body        text not null,
  kind        text not null default 'message'
              check (kind in ('message', 'task', 'announcement')),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists course_messages_course_idx
  on public.course_messages (course_id, created_at desc);

create table if not exists public.course_task_completions (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.course_messages (id) on delete cascade,
  student_id   uuid not null references public.students (id) on delete cascade,
  response     text,
  completed_at timestamptz not null default now(),
  unique (message_id, student_id)
);

-- ============================================================================
-- HELPER FUNCTIONS — SECURITY DEFINER so RLS policies can't recurse.
-- ============================================================================
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

create or replace function public.my_course_id()
returns uuid language sql security definer set search_path = public stable as $$
  select course_id from public.students
  where id = auth.uid() and status = 'active';
$$;

create or replace function public.course_leaderboard()
returns table (student_id uuid, full_name text, xp integer, streak integer)
language sql security definer set search_path = public stable as $$
  select s.id, s.full_name, s.xp, s.streak
  from public.students s
  where s.status = 'active'
    and s.course_id = public.my_course_id()
    and public.my_course_id() is not null
  order by s.xp desc, s.streak desc
  limit 100;
$$;

-- Securely grade a quiz — the score is computed from the stored answer key,
-- so the correct answers never need to reach the browser.
create or replace function public.submit_quiz(p_quiz_id uuid, p_answers jsonb)
returns table (score integer, total integer)
language plpgsql security definer set search_path = public as $$
declare
  q       record;
  v_total integer;
  v_score integer := 0;
  i       integer;
begin
  select * into q from public.quizzes where id = p_quiz_id;
  if not found or not q.is_published or q.course_id is distinct from public.my_course_id() then
    raise exception 'Quiz not available';
  end if;

  v_total := jsonb_array_length(q.questions);
  for i in 0 .. greatest(v_total, 1) - 1 loop
    if v_total > 0
       and (q.questions->i->>'correct')::int = coalesce((p_answers->>i)::int, -1) then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.quiz_attempts (quiz_id, student_id, answers, score, total)
  values (p_quiz_id, auth.uid(), p_answers, v_score, v_total)
  on conflict (quiz_id, student_id) do nothing;

  return query select v_score, v_total;
end;
$$;

-- A student updates their OWN profile through this function — it touches only
-- safe columns, so xp / streak / course_id / status can never be self-edited.
create or replace function public.update_my_profile(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.students set
    full_name            = coalesce(p->>'full_name', full_name),
    bio                  = coalesce(p->>'bio', bio),
    avatar_url           = coalesce(p->>'avatar_url', avatar_url),
    country              = coalesce(p->>'country', country),
    timezone             = coalesce(p->>'timezone', timezone),
    domain               = coalesce(p->>'domain', domain),
    experience_level     = coalesce(p->>'experience_level', experience_level),
    goal                 = coalesce(p->>'goal', goal),
    weekly_commitment    = coalesce(p->>'weekly_commitment', weekly_commitment),
    daily_goal           = coalesce((p->>'daily_goal')::int, daily_goal),
    onboarding_completed = coalesce((p->>'onboarding_completed')::boolean, onboarding_completed),
    updated_at           = now()
  where id = auth.uid();
end;
$$;

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_students_course        on public.students (course_id);
create index if not exists idx_students_xp             on public.students (xp desc);
create index if not exists idx_modules_course          on public.modules (course_id);
create index if not exists idx_lessons_course          on public.lessons (course_id);
create index if not exists idx_lessons_module          on public.lessons (module_id);
create index if not exists idx_lesson_resources_lesson on public.lesson_resources (lesson_id);
create index if not exists idx_assignments_course      on public.assignments (course_id);
create index if not exists idx_submissions_assignment  on public.submissions (assignment_id);
create index if not exists idx_submissions_student     on public.submissions (student_id);
create index if not exists idx_quizzes_course          on public.quizzes (course_id);
create index if not exists idx_quiz_attempts_student   on public.quiz_attempts (student_id);
create index if not exists idx_activity_student        on public.activity_log (student_id, created_at desc);
create index if not exists idx_activity_created        on public.activity_log (created_at desc);
create index if not exists idx_lesson_progress_student on public.lesson_progress (student_id);
create index if not exists idx_notifications_recipient on public.notifications (recipient_id, is_read);
create index if not exists idx_student_ach_student     on public.student_achievements (student_id);
create index if not exists idx_calendar_course         on public.calendar_events (course_id, starts_at);
create index if not exists idx_calendar_owner          on public.calendar_events (owner_student_id, starts_at);

-- ============================================================================
-- updated_at TRIGGERS
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['courses','students','modules','lessons','assignments','submissions','quizzes','calendar_events']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- ============================================================================
-- AUTH TRIGGERS on auth.users
-- ============================================================================
create or replace function public.auto_confirm_user()
returns trigger language plpgsql security definer as $$
begin
  -- The allowlist is the gate, not an email-verification step — so every new
  -- account is confirmed immediately and can sign in straight away. (Google
  -- accounts already arrive confirmed; this covers email + password signups.)
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_on_signup on auth.users;
create trigger auto_confirm_on_signup
  before insert on auth.users
  for each row execute function public.auto_confirm_user();

-- Runs after every auth.users INSERT. For students it enforces the allowlist:
-- the email MUST already exist in public.allowed_students, otherwise this
-- raises — which rolls back the auth.users INSERT, so the account is never
-- created. This is the single gate for BOTH Google and email+password signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_name text  := coalesce(
    nullif(meta->>'full_name', ''),
    nullif(meta->>'name', ''),
    nullif(trim(coalesce(meta->>'first_name', '') || ' ' || coalesce(meta->>'last_name', '')), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );
  v_allowed public.allowed_students%rowtype;
begin
  -- Admins are provisioned directly (DB seed / explicit metadata) and skip
  -- the allowlist gate entirely.
  if coalesce(meta->>'account_type', 'student') = 'admin' then
    insert into public.admins (id, email, full_name)
    values (new.id, new.email, coalesce(nullif(meta_name, ''), 'Administrator'))
    on conflict (id) do nothing;
    return new;
  end if;

  -- Students must be pre-approved. Match the email case-insensitively against
  -- the allowlist; no match => reject the signup (rolls this INSERT back).
  select * into v_allowed
  from public.allowed_students
  where lower(email) = lower(coalesce(new.email, ''));

  if not found then
    raise exception 'EMAIL_NOT_APPROVED: % is not on the student allowlist', new.email
      using hint = 'An admin must add this email before the account can be created.';
  end if;

  -- Approved — create the student, seeding course / batch / name from the
  -- admin-entered allowlist row.
  insert into public.students (id, email, full_name, course_id, batch)
  values (
    new.id,
    new.email,
    coalesce(nullif(v_allowed.full_name, ''), meta_name),
    v_allowed.course_id,
    v_allowed.batch
  )
  on conflict (id) do nothing;

  -- Record who claimed the allowlist entry (audit trail).
  update public.allowed_students
     set claimed_by = new.id, claimed_at = now()
   where id = v_allowed.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- GAMIFICATION ENGINE — XP, streaks and badges all flow through activity_log.
-- ============================================================================
create or replace function public.handle_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s          record;
  last_day   date;
  new_streak integer;
  a          record;
begin
  select * into s from public.students where id = new.student_id;
  if not found then return new; end if;

  last_day := (s.last_active_at)::date;
  if last_day is null then
    new_streak := 1;
  elsif last_day = current_date then
    new_streak := greatest(s.streak, 1);
  elsif last_day = current_date - 1 then
    new_streak := s.streak + 1;
  else
    new_streak := 1;
  end if;

  update public.students
     set xp             = xp + coalesce(new.xp_delta, 0),
         streak         = new_streak,
         longest_streak = greatest(longest_streak, new_streak),
         last_active_at = now(),
         last_login_at  = case when new.type = 'login' then now() else last_login_at end
   where id = new.student_id;

  for a in
    select ac.id, ac.title from public.achievements ac
    where ac.xp_threshold is not null
      and ac.xp_threshold <= (s.xp + coalesce(new.xp_delta, 0))
      and not exists (
        select 1 from public.student_achievements sa
        where sa.student_id = new.student_id and sa.achievement_id = ac.id)
  loop
    insert into public.student_achievements (student_id, achievement_id)
    values (new.student_id, a.id) on conflict do nothing;
    insert into public.notifications (recipient_id, type, title, body)
    values (new.student_id, 'achievement', 'Badge unlocked: ' || a.title,
            'You earned a new achievement. Keep it up!');
  end loop;

  return new;
end;
$$;

drop trigger if exists on_activity_logged on public.activity_log;
create trigger on_activity_logged
  after insert on public.activity_log
  for each row execute function public.handle_activity();

create or replace function public.on_lesson_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log (student_id, type, detail, xp_delta)
  values (new.student_id, 'lesson_completed',
          jsonb_build_object('lesson_id', new.lesson_id), 10);
  return new;
end;
$$;

drop trigger if exists on_lesson_progress_insert on public.lesson_progress;
create trigger on_lesson_progress_insert
  after insert on public.lesson_progress
  for each row execute function public.on_lesson_progress();

create or replace function public.on_submission_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log (student_id, type, detail, xp_delta)
  values (new.student_id, 'assignment_submitted',
          jsonb_build_object('assignment_id', new.assignment_id), 5);

  insert into public.notifications (recipient_id, type, title, body, link)
  select a.id, 'submission', 'New assignment submission',
         'A student submitted work for review.',
         '/admin/assignments/' || new.assignment_id::text
  from public.admins a;
  return new;
end;
$$;

drop trigger if exists on_submission_created on public.submissions;
create trigger on_submission_created
  after insert on public.submissions
  for each row execute function public.on_submission_insert();

create or replace function public.on_submission_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
    insert into public.activity_log (student_id, type, detail, xp_delta)
    values (new.student_id, 'assignment_approved',
            jsonb_build_object('assignment_id', new.assignment_id),
            coalesce(new.xp_awarded, 0));
    insert into public.notifications (recipient_id, type, title, body)
    values (new.student_id, 'grade', 'Assignment approved 🎉',
            'Your submission was approved' ||
            case when coalesce(new.xp_awarded,0) > 0
                 then ' (+' || new.xp_awarded || ' XP).' else '.' end);
  elsif new.status = 'rejected' and coalesce(old.status, '') <> 'rejected' then
    insert into public.notifications (recipient_id, type, title, body)
    values (new.student_id, 'grade', 'Assignment needs changes',
            'Your submission was rejected — check the feedback and resubmit.');
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_changed on public.submissions;
create trigger on_submission_changed
  after update on public.submissions
  for each row execute function public.on_submission_update();

-- Completing a quiz awards XP proportional to the score.
create or replace function public.on_quiz_attempt()
returns trigger language plpgsql security definer set search_path = public as $$
declare q record; reward integer;
begin
  select * into q from public.quizzes where id = new.quiz_id;
  reward := case when new.total > 0
                 then round(coalesce(q.xp_reward, 0) * new.score::numeric / new.total)
                 else 0 end;
  insert into public.activity_log (student_id, type, detail, xp_delta)
  values (new.student_id, 'quiz_completed',
          jsonb_build_object('quiz_id', new.quiz_id, 'score', new.score, 'total', new.total),
          reward);
  insert into public.notifications (recipient_id, type, title, body)
  values (new.student_id, 'quiz', 'Quiz completed',
          'You scored ' || new.score || '/' || new.total ||
          case when reward > 0 then ' (+' || reward || ' XP).' else '.' end);
  return new;
end;
$$;

drop trigger if exists on_quiz_attempt_insert on public.quiz_attempts;
create trigger on_quiz_attempt_insert
  after insert on public.quiz_attempts
  for each row execute function public.on_quiz_attempt();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.admins             enable row level security;
alter table public.students           enable row level security;
alter table public.allowed_students   enable row level security;
alter table public.courses            enable row level security;
alter table public.modules            enable row level security;
alter table public.lessons            enable row level security;
alter table public.lesson_resources   enable row level security;
alter table public.assignments        enable row level security;
alter table public.submissions        enable row level security;
alter table public.quizzes            enable row level security;
alter table public.quiz_attempts      enable row level security;
alter table public.activity_log       enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.notifications      enable row level security;
alter table public.achievements       enable row level security;
alter table public.student_achievements enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.course_messages    enable row level security;
alter table public.course_task_completions enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('admins','students','allowed_students','courses','modules','lessons',
                        'lesson_resources','assignments','submissions','quizzes','quiz_attempts',
                        'activity_log','lesson_progress','notifications','achievements',
                        'student_achievements','calendar_events',
                        'course_messages','course_task_completions')
  loop
    execute format('drop policy if exists %I on public.%I;', r.policyname, r.tablename);
  end loop;
end;
$$;

-- ---- admins ----------------------------------------------------------------
create policy "admins read own row"
  on public.admins for select to authenticated using (id = auth.uid());
create policy "admins update own row"
  on public.admins for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- students --------------------------------------------------------------
create policy "students read own or admin all"
  on public.students for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "students admin updates"
  on public.students for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "students admin deletes"
  on public.students for delete to authenticated using (public.is_admin());

-- ---- allowed_students (the signup allowlist) -------------------------------
-- Only admins ever touch this directly. The signup gate reads it through a
-- SECURITY DEFINER trigger, which bypasses RLS.
create policy "allowed_students admin manages"
  on public.allowed_students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- courses ---------------------------------------------------------------
create policy "courses admin all student own"
  on public.courses for select to authenticated
  using (public.is_admin() or id = public.my_course_id());
create policy "courses admin manages"
  on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- modules ---------------------------------------------------------------
create policy "modules admin all student own"
  on public.modules for select to authenticated
  using (public.is_admin() or course_id = public.my_course_id());
create policy "modules admin manages"
  on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- lessons ---------------------------------------------------------------
create policy "lessons admin all student own published"
  on public.lessons for select to authenticated
  using (public.is_admin() or (is_published and course_id = public.my_course_id()));
create policy "lessons admin manages"
  on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- lesson_resources ------------------------------------------------------
create policy "lesson_resources admin all student own"
  on public.lesson_resources for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.lessons l
      where l.id = lesson_resources.lesson_id
        and l.is_published and l.course_id = public.my_course_id())
  );
create policy "lesson_resources admin manages"
  on public.lesson_resources for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- assignments -----------------------------------------------------------
create policy "assignments admin all student own published"
  on public.assignments for select to authenticated
  using (public.is_admin() or (is_published and course_id = public.my_course_id()));
create policy "assignments admin manages"
  on public.assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- submissions -----------------------------------------------------------
create policy "submissions student own admin all"
  on public.submissions for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
create policy "submissions student creates own"
  on public.submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = submissions.assignment_id
        and a.is_published and a.course_id = public.my_course_id())
  );
create policy "submissions student edits own not approved"
  on public.submissions for update to authenticated
  using (student_id = auth.uid() and status <> 'approved')
  with check (student_id = auth.uid());
create policy "submissions admin grades"  
  on public.submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "submissions admin deletes"
  on public.submissions for delete to authenticated using (public.is_admin());

-- ---- quizzes ---------------------------------------------------------------
create policy "quizzes admin all student own published"
  on public.quizzes for select to authenticated
  using (public.is_admin() or (is_published and course_id = public.my_course_id()));
create policy "quizzes admin manages"
  on public.quizzes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- quiz_attempts ---------------------------------------------------------
create policy "quiz_attempts student own admin all"
  on public.quiz_attempts for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
create policy "quiz_attempts student creates own"
  on public.quiz_attempts for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.quizzes q
      where q.id = quiz_attempts.quiz_id
        and q.is_published and q.course_id = public.my_course_id())
  );

-- ---- activity_log ----------------------------------------------------------
create policy "activity student own admin all"
  on public.activity_log for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
create policy "activity student logs own"
  on public.activity_log for insert to authenticated
  with check (student_id = auth.uid());

-- ---- lesson_progress -------------------------------------------------------
create policy "progress student own admin all"
  on public.lesson_progress for select to authenticated
  using (student_id = auth.uid() or public.is_admin());
create policy "progress student marks own"
  on public.lesson_progress for insert to authenticated
  with check (student_id = auth.uid());

-- ---- notifications ---------------------------------------------------------
create policy "notifications read own"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy "notifications update own"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "notifications admin sends"
  on public.notifications for insert to authenticated
  with check (public.is_admin());

-- ---- achievements (public catalogue) ---------------------------------------
create policy "achievements readable"
  on public.achievements for select to authenticated using (true);
create policy "achievements admin manages"
  on public.achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- student_achievements --------------------------------------------------
create policy "student_achievements own or admin"
  on public.student_achievements for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- ---- calendar_events -------------------------------------------------------
create policy "calendar select"
  on public.calendar_events for select to authenticated
  using (
    public.is_admin()
    or (owner_student_id is null and course_id = public.my_course_id())
    or owner_student_id = auth.uid()
  );
create policy "calendar admin manages"
  on public.calendar_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "calendar student creates own"
  on public.calendar_events for insert to authenticated
  with check (owner_student_id = auth.uid() and course_id = public.my_course_id());
create policy "calendar student updates own"
  on public.calendar_events for update to authenticated
  using (owner_student_id = auth.uid()) with check (owner_student_id = auth.uid());
create policy "calendar student deletes own"
  on public.calendar_events for delete to authenticated
  using (owner_student_id = auth.uid());

-- ---- course_messages -------------------------------------------------------
-- Read: admins all; students only messages in their assigned course.
create policy "course_messages read"
  on public.course_messages for select to authenticated
  using (public.is_admin() or course_id = public.my_course_id());

-- Insert: admins write any kind in any course; students may only post a plain
-- 'message' in their own course, signed as themselves.
create policy "course_messages write"
  on public.course_messages for insert to authenticated
  with check (
    (public.is_admin() and sender_role = 'admin' and sender_id = auth.uid())
    or (
      sender_id = auth.uid()
      and sender_role = 'student'
      and kind = 'message'
      and course_id = public.my_course_id()
    )
  );

-- Admins can edit or remove any message; students can delete their own.
create policy "course_messages admin manages"
  on public.course_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "course_messages delete"
  on public.course_messages for delete to authenticated
  using (public.is_admin() or sender_id = auth.uid());

-- ---- course_task_completions ----------------------------------------------
-- Read: admins all; students only their own + their classmates' for the same
-- course (so they can see how many peers have completed in real time).
create policy "course_task_completions read"
  on public.course_task_completions for select to authenticated
  using (
    public.is_admin()
    or student_id = auth.uid()
    or exists (
      select 1 from public.course_messages m
      where m.id = course_task_completions.message_id
        and m.course_id = public.my_course_id()
    )
  );

-- Insert: a student records their own completion for a task in their course.
create policy "course_task_completions student writes own"
  on public.course_task_completions for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.course_messages m
      where m.id = course_task_completions.message_id
        and m.kind = 'task'
        and m.course_id = public.my_course_id()
    )
  );

-- Update: student edits their own response text; admins can adjust any.
create policy "course_task_completions update"
  on public.course_task_completions for update to authenticated
  using (public.is_admin() or student_id = auth.uid())
  with check (public.is_admin() or student_id = auth.uid());

-- Delete: a student can undo their own completion; admins can remove any.
create policy "course_task_completions delete"
  on public.course_task_completions for delete to authenticated
  using (public.is_admin() or student_id = auth.uid());

-- ============================================================================
-- REALTIME — broadcast new playground messages + task completions over WS
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'course_messages'
  ) then
    alter publication supabase_realtime add table public.course_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'course_task_completions'
  ) then
    alter publication supabase_realtime add table public.course_task_completions;
  end if;
end;
$$;

-- ============================================================================
-- PROFILES VIEW
-- ----------------------------------------------------------------------------
-- `students` IS the student profile table for this platform. This view simply
-- exposes it under the spec-named `profiles` with the requested columns
-- (id, full_name, email, role, course, batch, onboarding_completed,
-- created_at). `security_invoker` makes it follow the same RLS as `students`.
-- ============================================================================
create or replace view public.profiles
  with (security_invoker = on) as
select
  id,
  full_name,
  email,
  role,
  course_id            as course,
  batch,
  onboarding_completed,
  created_at
from public.students;

-- ============================================================================
-- SEED — achievement catalogue
-- ============================================================================
insert into public.achievements (code, title, description, icon, xp_threshold) values
  ('starter',   'Getting Started',    'Earn your first 50 XP.',      'sparkles', 50),
  ('on_a_roll', 'On a Roll',          'Reach 150 XP.',               'flame',    150),
  ('committed', 'Committed Learner',  'Reach 350 XP.',               'target',   350),
  ('achiever',  'High Achiever',      'Reach 700 XP.',               'trophy',   700),
  ('legend',    'Platform Legend',    'Reach 1500 XP.',              'crown',    1500)
on conflict (code) do nothing;

-- ============================================================================
-- SELF-HEAL — make existing accounts usable
-- ============================================================================
do $$
declare n_confirmed int; n_students int;
begin
  update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
  get diagnostics n_confirmed = row_count;

  insert into public.students (id, email, full_name)
  select u.id, u.email,
         coalesce(nullif(u.raw_user_meta_data->>'full_name', ''),
                  nullif(u.raw_user_meta_data->>'name', ''),
                  split_part(coalesce(u.email, ''), '@', 1), '')
  from auth.users u
  where not exists (select 1 from public.admins   a where a.id = u.id)
    and not exists (select 1 from public.students s where s.id = u.id);
  get diagnostics n_students = row_count;

  raise notice 'Self-heal: % account(s) confirmed, % student row(s) created.',
               n_confirmed, n_students;
end;
$$;

-- ============================================================================
-- SEED — admin login  (admin@eduhub.com / Admin@12345)
-- ============================================================================
do $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'admin@eduhub.com';

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated', 'admin@eduhub.com',
      extensions.crypt('Admin@12345', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"account_type":"admin","full_name":"Platform Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin@eduhub.com'),
      'email', v_uid::text, now(), now(), now()
    );
  end if;

  delete from public.students where id = v_uid;
  insert into public.admins (id, email, full_name)
  values (v_uid, 'admin@eduhub.com', 'Platform Admin')
  on conflict (id) do nothing;

  raise notice 'Admin ready: admin@eduhub.com / Admin@12345';
end;
$$;

-- ============================================================================
-- SEED — sample courses (only when there are none)
-- ============================================================================
do $$
declare v_course uuid;
begin
  if not exists (select 1 from public.courses) then
    insert into public.courses (title, description, duration_weeks, order_index)
    values ('Web Development Bootcamp',
            'Learn HTML, CSS, JavaScript and React from scratch.', 12, 0)
    returning id into v_course;
    insert into public.lessons (course_id, title, description, content, is_published, order_index)
    values
      (v_course, 'Getting Started with the Web', 'How the web works.',
       'Welcome! How browsers, HTML and servers fit together.', true, 0),
      (v_course, 'HTML & CSS Basics', 'Structure and style a page.',
       'HTML gives structure; CSS gives style.', true, 1);
    insert into public.assignments (course_id, title, description, instructions, points_possible, is_published, order_index)
    values (v_course, 'Build a Personal Profile Page', 'A single-page profile in HTML/CSS.',
            'Submit a link or code for a page with your name, photo and bio.', 100, true, 0);

    insert into public.courses (title, description, duration_weeks, order_index)
    values ('Data Science Fundamentals',
            'Python, statistics and data visualisation for beginners.', 10, 1)
    returning id into v_course;
    insert into public.lessons (course_id, title, description, content, is_published, order_index)
    values
      (v_course, 'Intro to Python', 'Variables, types and your first script.',
       'Python is a friendly language for data work.', true, 0),
      (v_course, 'Working with Data', 'Reading data and basic statistics.',
       'Load a dataset and compute averages.', true, 1);
    insert into public.assignments (course_id, title, description, instructions, points_possible, is_published, order_index)
    values (v_course, 'Analyse a Small Dataset', 'Summary statistics for a dataset.',
            'Submit your Python code and a short write-up.', 100, true, 0);

    raise notice 'Seeded 2 sample courses.';
  end if;
end;
$$;
