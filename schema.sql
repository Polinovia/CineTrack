create table users (
  id serial primary key,
  username text unique not null,
  password_hash text,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table titles (
  id serial primary key,
  owner_id int not null references users(id) on delete cascade,
  title text not null,
  type text not null default 'film',
  status text not null default 'a_voir',
  now_watching boolean not null default false,
  poster_url text,
  description text,
  genres text,
  tmdb_rating numeric(3,1),
  season_count int,
  episode_count int,
  release_date date,
  trailer_url text,
  notified_month boolean not null default false,
  notified_week boolean not null default false,
  notified_tomorrow boolean not null default false,
  created_at timestamptz not null default now()
);

create table ratings (
  id serial primary key,
  title_id int not null references titles(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  status text not null default 'a_voir',
  score int check (score between 1 and 10),
  comment text,
  rated_at timestamptz not null default now(),
  unique (title_id, user_id)
);

create table season_progress (
  id serial primary key,
  title_id int not null references titles(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  season_number int not null,
  created_at timestamptz not null default now(),
  unique (title_id, user_id, season_number)
);

create table friendships (
  id serial primary key,
  requester_id int not null references users(id) on delete cascade,
  addressee_id int not null references users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create table push_subscriptions (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
