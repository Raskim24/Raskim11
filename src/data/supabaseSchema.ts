export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- QuizBlast Supabase Production Schema & Security Rules
-- Compatible with Supabase PostgreSQL (Auth + Row Level Security)
-- =========================================================

-- 1. Profiles Table (Automatically synced from Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Trigger: create profile when new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists and create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Quizzes Table
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quizzes enable row level security;

create policy "owner can read own quizzes" on public.quizzes
  for select using (owner_id = auth.uid());

create policy "owner can insert own quizzes" on public.quizzes
  for insert with check (owner_id = auth.uid());

create policy "owner can update own quizzes" on public.quizzes
  for update using (owner_id = auth.uid());

create policy "owner can delete own quizzes" on public.quizzes
  for delete using (owner_id = auth.uid());

-- 4. Questions Table
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  image_url text,
  time_limit int default 20 not null,
  points int default 1000 not null,
  question_type text default 'multiple_choice' not null,
  order_index int default 0 not null,
  explanation text
);

alter table public.questions enable row level security;

create policy "owner can read own questions" on public.questions
  for select using (
    exists (select 1 from public.quizzes where quizzes.id = questions.quiz_id and quizzes.owner_id = auth.uid())
  );

create policy "owner can insert own questions" on public.questions
  for insert with check (
    exists (select 1 from public.quizzes where quizzes.id = questions.quiz_id and quizzes.owner_id = auth.uid())
  );

create policy "owner can update own questions" on public.questions
  for update using (
    exists (select 1 from public.quizzes where quizzes.id = questions.quiz_id and quizzes.owner_id = auth.uid())
  );

create policy "owner can delete own questions" on public.questions
  for delete using (
    exists (select 1 from public.quizzes where quizzes.id = questions.quiz_id and quizzes.owner_id = auth.uid())
  );

-- 5. Answers Table
create table if not exists public.answers (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  answer_text text not null,
  is_correct boolean default false not null,
  order_index int default 0 not null
);

alter table public.answers enable row level security;

create policy "owner can manage answers" on public.answers
  for all using (
    exists (
      select 1 from public.questions
      join public.quizzes on quizzes.id = questions.quiz_id
      where questions.id = answers.question_id and quizzes.owner_id = auth.uid()
    )
  );

-- 6. Live Games Table
create table if not exists public.games (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete set null,
  pin varchar(6) not null,
  status text default 'lobby' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.games enable row level security;

create policy "owner can manage own games" on public.games
  for all using (owner_id = auth.uid());

-- 7. Game Players (temporary / live record)
create table if not exists public.game_players (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  nickname varchar(50) not null,
  score int default 0 not null,
  streak int default 0 not null,
  avatar text
);

alter table public.game_players enable row level security;

create policy "owner can read game players" on public.game_players
  for select using (
    exists (select 1 from public.games where games.id = game_players.game_id and games.owner_id = auth.uid())
  );

-- 8. Game Responses
create table if not exists public.game_responses (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  player_id uuid references public.game_players(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  choice_index int not null,
  time_taken_ms int not null,
  is_correct boolean not null,
  points_awarded int not null
);

alter table public.game_responses enable row level security;

create policy "owner can read responses" on public.game_responses
  for select using (
    exists (select 1 from public.games where games.id = game_responses.game_id and games.owner_id = auth.uid())
  );
`;
