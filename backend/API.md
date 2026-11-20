# Referencja API

Adres API lokalnie: http://127.0.0.1:5000.

## Konwencje

- Body requestów JSON wysyłaj z nagłówkiem Content-Type: application/json.
- Standardowy format błędu to {"error": "Opis błędu"}.
- Sesja znajduje się w ciasteczku auth_session (HttpOnly, ważne 7 dni). Przy
  komunikacji między originami użyj w fetch opcji credentials: "include".
- CORS jest dostępny tylko dla originu ustawionego w FRONTEND_ORIGIN. Backend
  zezwala na metody GET, POST i OPTIONS.
- Typowe kody odpowiedzi: 400 — niepoprawne dane, 401 — brak sesji, 403 — brak
  wymaganego nagłówka, 404 — zasób nie istnieje, 503 — baza danych jest
  niedostępna.

## Stan aplikacji

| Metoda | Endpoint | Przyjmuje | Zwraca |
| --- | --- | --- | --- |
| GET | /api/health | Nic. | 200 {"status":"ok"} |
| GET | /api/db-health | Nic. | 200 {"status":"ok"}, a przy problemie z bazą 503 {"status":"error"}. |

## Uwierzytelnianie

| Metoda | Endpoint | Przyjmuje | Zwraca |
| --- | --- | --- | --- |
| GET | /api/auth/google | Nic. | 302 do Google OAuth. |
| GET | /api/auth/google/callback | Query code i state od Google. | Ustawia sesję i zwraca 302 do frontendu. |
| POST | /api/auth/mock | Nagłówek X-Requested-With: XMLHttpRequest; bez body. | 200 {"status":"ok"} i cookie sesji; tylko w trybie mock. |
| GET | /api/auth/me | Cookie auth_session. | Dane zalogowanego użytkownika albo 401. |
| POST | /api/auth/logout | Cookie sesji i X-Requested-With: XMLHttpRequest; bez body. | 200 {"status":"ok"}, unieważnia sesję i usuwa cookie. |

### GET /api/auth/me

~~~json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "picture": "https://example.com/avatar.png",
    "created_at": "..."
  }
}
~~~

Brak, wygaśnięcie albo nieprawidłowość sesji daje
401 {"error":"Not authenticated"}. Logowanie Google jest dostępne tylko przy
AUTH_MODE=google, a login mock tylko przy AUTH_MODE=mock. Niepoprawny callback
OAuth zwraca 400, a brak konfiguracji OAuth lub błąd zapisu 503.

Przykład wylogowania:

~~~js
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  credentials: 'include',
});
~~~

## Kursy, lekcje i aktywności

| Metoda | Endpoint | Przyjmuje | Zwraca |
| --- | --- | --- | --- |
| GET | /api/courses | Opcjonalny query parameter category. | Lista opublikowanych kursów. |
| GET | /api/courses/:id-lub-slug | Numeryczne ID albo slug. | Kurs, lekcje i metadane aktywności. |
| POST | /api/courses/:courseId/enroll | Bez body. | Rozpoczęcie kursu. |
| GET | /api/lessons/:lessonId | Numeryczne ID lekcji. | Lekcja i metadane aktywności. |
| GET | /api/activities/:activityId | Numeryczne ID aktywności. | Pełna aktywność z content. |
| POST | /api/activities/:activityId/complete | Bez body. | Ukończenie artykułu lub wideo. |
| POST | /api/activities/:activityId/quiz-submit | JSON z odpowiedziami. | Wynik i omówienie quizu. |
| GET | /api/user/progress | Wymaga sesji. | Zbiorczy postęp użytkownika. |
| POST | /api/user/progress/sync | Wymaga sesji oraz danych lokalnych. | Synchronizuje anonimowy postęp. |

### GET /api/courses

Opcjonalny filtr: /api/courses?category=investing.

~~~json
{
  "courses": [
    {
      "id": 1,
      "slug": "podstawy-gieldy",
      "title": "Podstawy Giełdy",
      "description": "...",
      "category": "investing",
      "difficulty": "beginner",
      "estimated_minutes": 20,
      "icon_url": null,
      "is_published": true,
      "created_at": "2026-11-21T10:00:00+00:00",
      "total_activities": 3,
      "lessons_count": 1,
      "user_progress": {
        "enrolled": true,
        "completed_activities": 2,
        "total_activities": 3,
        "percentage": 67,
        "is_completed": false
      }
    }
  ]
}
~~~

Pole user_progress występuje wyłącznie dla zalogowanego użytkownika.

### GET /api/courses/:id-lub-slug

Przyjmuje id lub slug, np. /api/courses/1 albo
/api/courses/podstawy-gieldy. Nieistniejący lub nieopublikowany kurs daje
404 {"error":"Course not found"}.

~~~json
{
  "course": {
    "id": 1,
    "slug": "podstawy-gieldy",
    "title": "Podstawy Giełdy",
    "lessons": [
      {
        "id": 10,
        "course_id": 1,
        "title": "Akcje i obligacje",
        "description": "...",
        "order_index": 1,
        "xp_reward": 20,
        "is_published": true,
        "is_completed": false,
        "activities": [
          {
            "id": 100,
            "lesson_id": 10,
            "title": "Czym jest akcja?",
            "activity_type": "article",
            "order_index": 1,
            "xp_reward": 10,
            "coin_reward": 5,
            "estimated_minutes": 3,
            "is_completed": false
          }
        ]
      }
    ],
    "total_activities": 3
  }
}
~~~

Zalogowany użytkownik otrzymuje dodatkowo course.user_progress. Ten widok nie
zwraca content aktywności — pobiera się je szczegółowym endpointem.

### POST /api/courses/:courseId/enroll

Request nie ma body.

~~~json
{
  "status": "ok",
  "enrolled": true,
  "course_id": 1,
  "persisted": true
}
~~~

Dla anonimowego użytkownika odpowiedź ma persisted: false, dlatego stan trzeba
zapisać lokalnie. Nieistniejący lub nieopublikowany kurs zwraca 404.

### GET /api/lessons/:lessonId

Zwraca lesson z polami lekcji, metadanymi aktywności i flagą is_completed.
Treść aktywności nie jest w tym widoku zwracana. Nieistniejąca lub
nieopublikowana lekcja zwraca 404 {"error":"Lesson not found"}.

### GET /api/activities/:activityId

~~~json
{
  "activity": {
    "id": 100,
    "lesson_id": 10,
    "title": "Czym jest akcja?",
    "activity_type": "article",
    "order_index": 1,
    "xp_reward": 10,
    "coin_reward": 5,
    "estimated_minutes": 3,
    "content": {
      "markdown": "# Czym jest akcja?",
      "reading_time_minutes": 3
    },
    "user_progress": null
  }
}
~~~

Dla zalogowanego użytkownika user_progress ma pola status, quiz_score, passed,
attempts_count, xp_earned, coins_earned i completed_at. Dla quizu odpowiedź
celowo nie ujawnia correct_option_id ani explanation; pytania mają tylko id,
prompt i options. Nieistniejąca aktywność zwraca
404 {"error":"Activity not found"}.

### POST /api/activities/:activityId/complete

Nie przyjmuje body. Jest przeznaczony dla aktywności innych niż quiz.

~~~json
{
  "status": "ok",
  "activity_id": 100,
  "xp_earned": 10,
  "coins_earned": 5,
  "is_first_completion": true,
  "lesson_completed": false,
  "course_completed": false,
  "persisted": true
}
~~~

Powtórne ukończenie zwraca is_first_completion: false i nagrody równe 0.
Próba ukończenia quizu tym endpointem zwraca 400 z informacją, by użyć
/quiz-submit. Dla anonimowego użytkownika odpowiedź ma persisted: false.

### POST /api/activities/:activityId/quiz-submit

Request:

~~~json
{
  "answers": {
    "q1": "a",
    "q2": "b"
  }
}
~~~

Klucz w answers to ID pytania, a wartość to ID zaznaczonej opcji.

~~~json
{
  "status": "ok",
  "passed": true,
  "score": 100,
  "passing_score": 70,
  "correct_count": 2,
  "total_questions": 2,
  "xp_earned": 25,
  "coins_earned": 10,
  "is_first_completion": true,
  "lesson_completed": true,
  "course_completed": false,
  "persisted": true,
  "review": [
    {
      "question_id": "q1",
      "prompt": "Co daje posiadanie akcji?",
      "submitted_option": "a",
      "correct_option": "a",
      "is_correct": true,
      "explanation": "..."
    }
  ]
}
~~~

Nagrody są naliczane tylko przy pierwszym zaliczeniu. Dla aktywności innej niż
quiz endpoint zwraca 400 {"error":"Activity is not a quiz"}. Anonimowy
użytkownik otrzymuje wynik, ale z persisted: false.

### GET /api/user/progress

Wymaga aktywnej sesji; w przeciwnym wypadku zwraca 401.

~~~json
{
  "progress": {
    "total_xp": 50,
    "total_coins": 20,
    "completed_activities_count": 3,
    "enrolled_courses": [
      {
        "course_id": 1,
        "title": "Podstawy Giełdy",
        "slug": "podstawy-gieldy",
        "category": "investing",
        "difficulty": "beginner",
        "completed_activities": 3,
        "total_activities": 3,
        "percentage": 100,
        "is_completed": true,
        "enrolled_at": "2026-11-21T10:00:00+00:00"
      }
    ]
  }
}
~~~

### POST /api/user/progress/sync

Przenosi postęp anonimowy zapisany lokalnie na konto po zalogowaniu. Wymaga
aktywnej sesji.

~~~json
{
  "enrolled_course_ids": [1, 2],
  "activities": [
    {
      "activity_id": 100,
      "status": "completed",
      "passed": true,
      "quiz_score": null
    }
  ]
}
~~~

Status, passed i quiz_score są opcjonalne. Nieistniejące ID kursów i
aktywności są pomijane.

~~~json
{
  "status": "ok",
  "synced_enrollments": 2,
  "synced_activities": 1,
  "total_new_xp": 10,
  "total_new_coins": 5
}
~~~

## Czat Robert Biznesu

| Metoda | Endpoint | Przyjmuje | Zwraca |
| --- | --- | --- | --- |
| GET | /api/chat/voices | Nic. | Katalog głosów TTS. |
| POST | /api/chat/message | Wiadomość oraz opcjonalną historię i TTS. | Odpowiedź AI, źródła i opcjonalne audio. |
| POST | /api/chat/tts | Tekst oraz opcjonalny głos i format. | Binarny WAV albo JSON z Base64. |
| GET | /api/chat/knowledge | Nic. | Metadane tematów bazy RAG. |

### GET /api/chat/voices

~~~json
{
  "voices": [
    {
      "id": "Puck",
      "name": "Puck",
      "style": "Upbeat",
      "description": "Energiczny, optymistyczny i dynamiczny.",
      "gender": "male",
      "recommended": true
    }
  ],
  "default_voice": "Puck",
  "model": "gemini-3.8-flash-tts"
}
~~~

Dostępne ID głosów: Puck, Charon, Aoede, Kore, Zephyr, Fenrir, Achird,
Sadaltager, Algieba. Nieprawidłowy głos w TTS jest wewnętrznie zastępowany
przez Puck.

### POST /api/chat/message

Request:

~~~json
{
  "message": "Jak działa procent składany?",
  "voice": "Puck",
  "voice_enabled": true,
  "history": [
    { "role": "user", "content": "Czym jest ETF?" }
  ]
}
~~~

- message — wymagany, nie może być pusty;
- voice — opcjonalny, domyślnie Puck;
- voice_enabled — opcjonalny boolean, domyślnie false;
- history — opcjonalna tablica obiektów z role i content.

~~~json
{
  "reply": "Procent składany to...",
  "model": "gemini-3.5-flash-lite",
  "voice": "Puck",
  "voice_enabled": true,
  "audio_base64": "UklGR...",
  "mime_type": "audio/wav",
  "sources": [
    {
      "id": "kb-procent-skladany",
      "title": "Procent składany i potęga czasu",
      "category": "investing",
      "score": 0.84,
      "related_course_slug": "podstawy-gieldy"
    }
  ],
  "suggested_lessons": [
    {
      "slug": "podstawy-gieldy",
      "title": "Procent składany i potęga czasu",
      "category": "investing"
    }
  ]
}
~~~

Bez voice_enabled pola audio_base64 i mime_type są null. Pusta wiadomość daje
400 {"error":"Wiadomość nie może być pusta"}. Gdy Gemini lub baza nie są
dostępne, czat używa trybu awaryjnego i nadal zwraca odpowiedź.

### POST /api/chat/tts

Request:

~~~json
{
  "text": "Witaj, Rekinie Biznesu!",
  "voice": "Kore",
  "format": "audio"
}
~~~

- text — wymagany;
- voice — opcjonalny, domyślnie Puck;
- format — audio (domyślnie) albo json.

Przy format: "audio" odpowiedź ma binarne dane z Content-Type: audio/wav.
Przy format: "json":

~~~json
{
  "audio_base64": "UklGR...",
  "mime_type": "audio/wav",
  "voice": "Kore"
}
~~~

Pusty text zwraca 400 {"error":"Brak tekstu do syntezy"}.

### GET /api/chat/knowledge

~~~json
{
  "count": 9,
  "topics": [
    {
      "id": "kb-etf-inwestowanie-pasywne",
      "title": "ETF-y i Inwestowanie Pasywne",
      "category": "investing",
      "keywords": ["etf", "indeks"],
      "related_course_slug": "podstawy-gieldy"
    }
  ]
}
~~~

Endpoint zwraca metadane kuratorowanych tematów RAG, a nie pełną treść źródeł.
