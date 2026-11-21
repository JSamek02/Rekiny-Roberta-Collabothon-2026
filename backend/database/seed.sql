-- Dane demonstracyjne z backend/tests/test_courses.py i backend/tests/test_chat.py.
-- Skrypt jest idempotentny: nie nadpisuje istniejących kursów ani nie usuwa
-- postępu użytkowników.

BEGIN;

INSERT INTO courses (
    slug, title, description, category, difficulty, estimated_minutes,
    icon_url, is_published, translations
)
VALUES (
    'podstawy-gieldy',
    'Podstawy Giełdy',
    'Naucz się inwestować z Robertem Biznesu',
    'investing',
    'beginner',
    20,
    NULL,
    TRUE,
    '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    courses.id,
    'Lekcja 1: Akcje vs Obligacje',
    'Podstawowe instrumenty finansowe',
    1,
    TRUE,
    30,
    '{}'::jsonb
FROM courses
WHERE courses.slug = 'podstawy-gieldy'
  AND NOT EXISTS (
      SELECT 1
      FROM lessons
      WHERE lessons.course_id = courses.id
        AND lessons.order_index = 1
  );

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    lessons.id,
    'Czym jest akcja?',
    'article',
    1,
    10,
    5,
    3,
    $${"markdown":"# Czym jest akcja?\nAkcja to papier wartościowy...","reading_time_minutes":3}$$::jsonb,
    '{}'::jsonb
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE courses.slug = 'podstawy-gieldy'
  AND lessons.order_index = 1
  AND NOT EXISTS (
      SELECT 1
      FROM activities
      WHERE activities.lesson_id = lessons.id
        AND activities.order_index = 1
  );

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    lessons.id,
    'Wideo: Jak działa parkiet GPW?',
    'video',
    2,
    15,
    5,
    3,
    $${"duration_seconds":180}$$::jsonb,
    '{}'::jsonb
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE courses.slug = 'podstawy-gieldy'
  AND lessons.order_index = 1
  AND NOT EXISTS (
      SELECT 1
      FROM activities
      WHERE activities.lesson_id = lessons.id
        AND activities.order_index = 2
  );

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    lessons.id,
    'Quiz sprawdzający',
    'quiz',
    3,
    25,
    10,
    3,
    $${"passing_score_percentage":50,"questions":[{"id":"q1","prompt":"Co daje posiadanie akcji?","options":[{"id":"a","text":"Udział w kapitale spółki"},{"id":"b","text":"Gwarancję zysku"}],"correct_option_id":"a","explanation":"Akcja daje udział własnościowy w spółce akcyjnej."},{"id":"q2","prompt":"Kto emituje obligacje skarbowe?","options":[{"id":"a","text":"Skarb Państwa"},{"id":"b","text":"Prywatna spółka zoo"}],"correct_option_id":"a","explanation":"Obligacje skarbowe są emitowane przez Skarb Państwa."}]}$$::jsonb,
    '{}'::jsonb
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE courses.slug = 'podstawy-gieldy'
  AND lessons.order_index = 1
  AND NOT EXISTS (
      SELECT 1
      FROM activities
      WHERE activities.lesson_id = lessons.id
        AND activities.order_index = 3
  );

INSERT INTO courses (
    slug, title, description, category, difficulty, estimated_minutes,
    icon_url, is_published, translations
)
VALUES (
    'inwestowanie-dla-rekinow',
    'Inwestowanie dla Rekinów',
    'Kompletny przewodnik po inwestowaniu',
    'investing',
    'beginner',
    15,
    NULL,
    TRUE,
    '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    courses.id,
    'Czym jest giełda i ETF?',
    'Wprowadzenie do giełdy papierów wartościowych',
    1,
    TRUE,
    20,
    '{}'::jsonb
FROM courses
WHERE courses.slug = 'inwestowanie-dla-rekinow'
  AND NOT EXISTS (
      SELECT 1
      FROM lessons
      WHERE lessons.course_id = courses.id
        AND lessons.order_index = 1
  );

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    lessons.id,
    'Wprowadzenie do ETF',
    'article',
    1,
    10,
    5,
    3,
    $${"markdown":"# Czym jest ETF?\nETF to fundusz inwestycyjny notowany na giełdzie, naśladujący indeksy."}$$::jsonb,
    '{}'::jsonb
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE courses.slug = 'inwestowanie-dla-rekinow'
  AND lessons.order_index = 1
  AND NOT EXISTS (
      SELECT 1
      FROM activities
      WHERE activities.lesson_id = lessons.id
        AND activities.order_index = 1
  );

COMMIT;
