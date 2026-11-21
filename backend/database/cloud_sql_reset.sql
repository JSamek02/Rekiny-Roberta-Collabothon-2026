-- URUCHOM TYLKO, JEŚLI ŚWIADOMIE CHCESZ USUNĄĆ WSZYSTKIE DANE APLIKACJI.
-- Usuwa użytkowników, sesje, kursy, postęp i materiały MP4; restartuje identyfikatory.
-- Dane symulacji są w kodzie Pythona, więc nie są objęte tym skryptem.

BEGIN;

-- Uzupełnienie tabel utworzonych przez starszą wersję backendu.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) NOT NULL DEFAULT 'pl',
    ADD COLUMN IF NOT EXISTS shark_coins INTEGER NOT NULL DEFAULT 0;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS activity_videos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    language VARCHAR(2) NOT NULL DEFAULT 'pl',
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(127) NOT NULL DEFAULT 'video/mp4',
    size_bytes BIGINT NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_activity_video_language UNIQUE (activity_id, language),
    CONSTRAINT ck_activity_videos_language CHECK (language IN ('pl', 'en', 'de'))
);

CREATE INDEX IF NOT EXISTS ix_activity_videos_activity_id
    ON activity_videos(activity_id);

TRUNCATE TABLE
    user_activity_progress,
    user_course_enrollments,
    activity_videos,
    activities,
    lessons,
    courses,
    user_sessions,
    users
RESTART IDENTITY CASCADE;

COMMIT;
