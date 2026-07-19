## Table `gallery`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `image_url` | `text` |  |
| `category` | `text` |  Nullable |
| `taken_at` | `date` |  Nullable |
| `is_published` | `bool` |  Nullable |
| `uploaded_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `points`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  Unique |
| `points_winner` | `int4` |  Nullable |
| `points_finalist` | `int4` |  Nullable |
| `points_semifinalist` | `int4` |  Nullable |
| `points_quarterfinalist` | `int4` |  Nullable |
| `points_r16` | `int4` |  Nullable |
| `points_r32` | `int4` |  Nullable |
| `points_r64` | `int4` |  Nullable |
| `description` | `text` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `tournaments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `points_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `location` | `text` |  Nullable |
| `start_date` | `date` |  |
| `registration_deadline` | `date` |  Nullable |
| `max_participants` | `int4` |  Nullable |
| `entry_fee` | `numeric` |  Nullable |
| `prize_pool` | `numeric` |  Nullable |
| `status` | `text` |  Nullable |
| `poster_url` | `text` |  Nullable |
| `rules` | `text` |  Nullable |
| `match_format` | `text` |  Nullable |
| `gender_category` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `tournament_participants`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tournament_id` | `uuid` |  Nullable |
| `profile_id` | `uuid` |  Nullable |
| `status` | `text` |  Nullable |
| `registered_at` | `timestamptz` |  Nullable |
| `payment_status` | `text` |  Nullable |
| `notes` | `text` |  Nullable |

## Table `spin_wheel_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tournament_id` | `uuid` |  Nullable Unique |
| `status` | `text` |  Nullable |
| `initial_players` | `jsonb` |  Nullable |
| `spun_players` | `jsonb` |  Nullable |
| `remaining_players` | `jsonb` |  Nullable |
| `pairs` | `jsonb` |  Nullable |
| `schedule_generated` | `bool` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `teams`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tournament_id` | `uuid` |  Nullable |
| `spin_session_id` | `uuid` |  Nullable |
| `name` | `text` |  Nullable |
| `player1_id` | `uuid` |  Nullable |
| `player2_id` | `uuid` |  Nullable |
| `is_bye_team` | `bool` |  Nullable |
| `group_name` | `text` |  Nullable |
| `group_position` | `int4` |  Nullable |
| `spin_order` | `int4` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `matches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tournament_id` | `uuid` |  Nullable |
| `spin_session_id` | `uuid` |  Nullable |
| `phase` | `text` |  |
| `group_name` | `text` |  Nullable |
| `round_number` | `int4` |  Nullable |
| `match_number` | `int4` |  Nullable |
| `team1_id` | `uuid` |  Nullable |
| `team2_id` | `uuid` |  Nullable |
| `is_bye` | `bool` |  Nullable |
| `status` | `text` |  Nullable |
| `score_team1` | `int4` |  Nullable |
| `score_team2` | `int4` |  Nullable |
| `winner_team_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `point_histories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `player_id` | `uuid` |  Nullable |
| `tournament_id` | `uuid` |  Nullable |
| `match_id` | `uuid` |  Nullable |
| `team_id` | `uuid` |  Nullable |
| `phase_achieved` | `text` |  Nullable |
| `points_earned` | `int4` |  |
| `points_before` | `int4` |  Nullable |
| `points_after` | `int4` |  Nullable |
| `notes` | `text` |  Nullable |
| `earned_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `start_date` | `date` |  |
| `end_date` | `date` |  Nullable |
| `level` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `profile`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable Unique |
| `fullname` | `text` |  Nullable |
| `username` | `text` |  Nullable Unique |
| `avatar_url` | `text` |  Nullable |
| `role` | `text` |  Nullable |
| `birth_date` | `date` |  Nullable |
| `gender` | `text` |  Nullable |
| `address` | `text` |  Nullable |
| `height` | `int4` |  Nullable |
| `hand_dominance` | `text` |  Nullable |
| `level` | `text` |  Nullable |
| `ranking_points` | `int4` |  Nullable |
| `ranking_position` | `int4` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `joined_at` | `date` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `carousels`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `image_url` | `text` |  |
| `order_index` | `int4` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

