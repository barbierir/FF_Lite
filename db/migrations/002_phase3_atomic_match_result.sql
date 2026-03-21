create table if not exists public.ff_lite_applied_match_results (
  match_id text primary key,
  player_a_id text not null,
  player_b_id text not null,
  winner_id text,
  result_type text not null check (result_type in ('player_a_win', 'player_b_win', 'draw')),
  finished_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default timezone('utc', now())
);

create index if not exists ff_lite_applied_match_results_finished_at_idx
  on public.ff_lite_applied_match_results (finished_at desc);

alter table public.ff_lite_daily_stats
  alter column variant_index set default 0,
  alter column wins set default 0,
  alter column losses set default 0,
  alter column draws set default 0,
  alter column matches_played set default 0,
  alter column day_bucket set not null,
  alter column player_id set not null,
  alter column display_name set not null,
  alter column variant_index set not null,
  alter column wins set not null,
  alter column losses set not null,
  alter column draws set not null,
  alter column matches_played set not null;

alter table public.ff_lite_player_ratings
  add column if not exists variant_index integer not null default 0;

alter table public.ff_lite_player_ratings
  alter column display_name set not null,
  alter column variant_index set default 0,
  alter column variant_index set not null,
  alter column rating set default 1000,
  alter column rating set not null,
  alter column wins set default 0,
  alter column wins set not null,
  alter column losses set default 0,
  alter column losses set not null,
  alter column draws set default 0,
  alter column draws set not null,
  alter column matches_played set default 0,
  alter column matches_played set not null,
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

create index if not exists ff_lite_daily_stats_day_bucket_wins_idx
  on public.ff_lite_daily_stats (day_bucket, wins desc, draws desc, losses asc, display_name asc);

create index if not exists ff_lite_player_ratings_rating_idx
  on public.ff_lite_player_ratings (rating desc, wins desc, losses asc, display_name asc);

alter table public.ff_lite_applied_match_results enable row level security;
alter table public.ff_lite_daily_stats enable row level security;
alter table public.ff_lite_player_ratings enable row level security;

-- Tighten direct public writes: clients now read leaderboard tables directly, but write through the RPC below.
drop policy if exists "lite daily stats are insertable" on public.ff_lite_daily_stats;
drop policy if exists "lite daily stats are updatable" on public.ff_lite_daily_stats;
drop policy if exists "lite player ratings are insertable" on public.ff_lite_player_ratings;
drop policy if exists "lite player ratings are updatable" on public.ff_lite_player_ratings;

create or replace function public.apply_ff_lite_match_result(
  p_match_id text,
  p_player_a_id text,
  p_player_a_name text,
  p_player_a_variant_index integer,
  p_player_b_id text,
  p_player_b_name text,
  p_player_b_variant_index integer,
  p_winner_id text,
  p_result_type text,
  p_finished_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day_bucket date;
  v_score_a numeric;
  v_score_b numeric;
  v_rating_a integer;
  v_rating_b integer;
  v_expected_a numeric;
  v_expected_b numeric;
  v_new_rating_a integer;
  v_new_rating_b integer;
  v_result_inserted_count integer := 0;
  v_existing_result public.ff_lite_applied_match_results%rowtype;
begin
  if p_match_id is null or btrim(p_match_id) = '' then
    raise exception 'match_id is required';
  end if;
  if p_player_a_id is null or btrim(p_player_a_id) = '' or p_player_b_id is null or btrim(p_player_b_id) = '' then
    raise exception 'both player ids are required';
  end if;
  if p_player_a_id = p_player_b_id then
    raise exception 'player ids must be distinct';
  end if;
  if p_result_type not in ('player_a_win', 'player_b_win', 'draw') then
    raise exception 'invalid result_type %', p_result_type;
  end if;
  if p_result_type = 'draw' and p_winner_id is not null then
    raise exception 'draw results cannot include a winner_id';
  end if;
  if p_result_type = 'player_a_win' and p_winner_id is distinct from p_player_a_id then
    raise exception 'winner_id must match player A for player_a_win';
  end if;
  if p_result_type = 'player_b_win' and p_winner_id is distinct from p_player_b_id then
    raise exception 'winner_id must match player B for player_b_win';
  end if;

  insert into public.ff_lite_applied_match_results (
    match_id,
    player_a_id,
    player_b_id,
    winner_id,
    result_type,
    finished_at,
    metadata
  ) values (
    p_match_id,
    p_player_a_id,
    p_player_b_id,
    p_winner_id,
    p_result_type,
    coalesce(p_finished_at, timezone('utc', now())),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (match_id) do nothing;

  get diagnostics v_result_inserted_count = row_count;

  if v_result_inserted_count = 0 then
    select *
      into v_existing_result
      from public.ff_lite_applied_match_results
     where match_id = p_match_id;

    return jsonb_build_object(
      'applied', false,
      'already_processed', true,
      'match_id', p_match_id,
      'result_type', v_existing_result.result_type,
      'processed_at', v_existing_result.processed_at
    );
  end if;

  v_day_bucket := (coalesce(p_finished_at, timezone('utc', now())) at time zone 'UTC')::date;

  insert into public.ff_lite_daily_stats (
    day_bucket,
    player_id,
    display_name,
    variant_index,
    wins,
    losses,
    draws,
    matches_played
  )
  values
    (
      v_day_bucket,
      p_player_a_id,
      p_player_a_name,
      coalesce(p_player_a_variant_index, 0),
      case when p_result_type = 'player_a_win' then 1 else 0 end,
      case when p_result_type = 'player_b_win' then 1 else 0 end,
      case when p_result_type = 'draw' then 1 else 0 end,
      1
    ),
    (
      v_day_bucket,
      p_player_b_id,
      p_player_b_name,
      coalesce(p_player_b_variant_index, 0),
      case when p_result_type = 'player_b_win' then 1 else 0 end,
      case when p_result_type = 'player_a_win' then 1 else 0 end,
      case when p_result_type = 'draw' then 1 else 0 end,
      1
    )
  on conflict (day_bucket, player_id) do update
    set display_name = excluded.display_name,
        variant_index = excluded.variant_index,
        wins = public.ff_lite_daily_stats.wins + excluded.wins,
        losses = public.ff_lite_daily_stats.losses + excluded.losses,
        draws = public.ff_lite_daily_stats.draws + excluded.draws,
        matches_played = public.ff_lite_daily_stats.matches_played + excluded.matches_played;

  insert into public.ff_lite_player_ratings (
    player_id,
    display_name,
    variant_index,
    rating,
    wins,
    losses,
    draws,
    matches_played
  ) values
    (p_player_a_id, p_player_a_name, coalesce(p_player_a_variant_index, 0), 1000, 0, 0, 0, 0),
    (p_player_b_id, p_player_b_name, coalesce(p_player_b_variant_index, 0), 1000, 0, 0, 0, 0)
  on conflict (player_id) do nothing;

  if p_player_a_id < p_player_b_id then
    perform 1 from public.ff_lite_player_ratings where player_id = p_player_a_id for update;
    perform 1 from public.ff_lite_player_ratings where player_id = p_player_b_id for update;
  else
    perform 1 from public.ff_lite_player_ratings where player_id = p_player_b_id for update;
    perform 1 from public.ff_lite_player_ratings where player_id = p_player_a_id for update;
  end if;

  select rating into v_rating_a from public.ff_lite_player_ratings where player_id = p_player_a_id;
  select rating into v_rating_b from public.ff_lite_player_ratings where player_id = p_player_b_id;

  v_score_a := case when p_result_type = 'player_a_win' then 1 when p_result_type = 'draw' then 0.5 else 0 end;
  v_score_b := case when p_result_type = 'player_b_win' then 1 when p_result_type = 'draw' then 0.5 else 0 end;
  v_expected_a := 1 / (1 + power(10::numeric, (v_rating_b - v_rating_a)::numeric / 400));
  v_expected_b := 1 / (1 + power(10::numeric, (v_rating_a - v_rating_b)::numeric / 400));
  v_new_rating_a := round(v_rating_a + 32 * (v_score_a - v_expected_a));
  v_new_rating_b := round(v_rating_b + 32 * (v_score_b - v_expected_b));

  update public.ff_lite_player_ratings
     set display_name = p_player_a_name,
         variant_index = coalesce(p_player_a_variant_index, variant_index),
         rating = v_new_rating_a,
         wins = wins + case when p_result_type = 'player_a_win' then 1 else 0 end,
         losses = losses + case when p_result_type = 'player_b_win' then 1 else 0 end,
         draws = draws + case when p_result_type = 'draw' then 1 else 0 end,
         matches_played = matches_played + 1,
         updated_at = timezone('utc', now())
   where player_id = p_player_a_id;

  update public.ff_lite_player_ratings
     set display_name = p_player_b_name,
         variant_index = coalesce(p_player_b_variant_index, variant_index),
         rating = v_new_rating_b,
         wins = wins + case when p_result_type = 'player_b_win' then 1 else 0 end,
         losses = losses + case when p_result_type = 'player_a_win' then 1 else 0 end,
         draws = draws + case when p_result_type = 'draw' then 1 else 0 end,
         matches_played = matches_played + 1,
         updated_at = timezone('utc', now())
   where player_id = p_player_b_id;

  return jsonb_build_object(
    'applied', true,
    'already_processed', false,
    'match_id', p_match_id,
    'day_bucket', v_day_bucket,
    'player_a', jsonb_build_object(
      'player_id', p_player_a_id,
      'previous_rating', v_rating_a,
      'new_rating', v_new_rating_a
    ),
    'player_b', jsonb_build_object(
      'player_id', p_player_b_id,
      'previous_rating', v_rating_b,
      'new_rating', v_new_rating_b
    )
  );
end;
$$;

revoke all on function public.apply_ff_lite_match_result(text, text, text, integer, text, text, integer, text, text, timestamptz, jsonb) from public;
grant execute on function public.apply_ff_lite_match_result(text, text, text, integer, text, text, integer, text, text, timestamptz, jsonb) to anon;
grant execute on function public.apply_ff_lite_match_result(text, text, text, integer, text, text, integer, text, text, timestamptz, jsonb) to authenticated;
