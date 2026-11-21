-- Bezpieczna migracja dla istniejącej bazy PostgreSQL. Nie usuwa danych.
BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0;

UPDATE users
SET experience_points = COALESCE(
    (
        SELECT SUM(user_activity_progress.xp_earned)
        FROM user_activity_progress
        WHERE user_activity_progress.user_id = users.id
    ),
    0
);

COMMIT;
