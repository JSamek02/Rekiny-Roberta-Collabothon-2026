# API backendu

Bazowy adres lokalny: `http://localhost:5000`.

Wszystkie odpowiedzi poza plikiem MP4 i strumieniem TTS są w JSON-ie. Błędy mają postać `{"error": "opis"}`. Endpointy chronione sesją korzystają z ciasteczka HttpOnly `auth_session`, ustawianego przez logowanie Google albo tryb demonstracyjny.

## Wspólne zasady

- Treści kursów, lekcji, aktywności i wyników quizu wybierają język z `Accept-Language`. Obsługiwane są `pl`, `en`, `de`; np. `de-DE` wybiera `de`. Brak dopasowania oznacza polski.
- Obecność poprawnej sesji dodaje dane postępu do odpowiedzi kursów, lekcji i aktywności. Gość nadal może czytać treści oraz lokalnie śledzić postęp.
- `401` oznacza brak zalogowanego użytkownika, `404` nieistniejący lub niedostępny zasób, a `503` brak połączenia z bazą lub brak wymaganej konfiguracji.

### Najważniejsze obiekty

`course`:

```json
{
  "id": 1,
  "slug": "podstawy-gieldy",
  "title": "Podstawy Giełdy",
  "description": "…",
  "category": "investing",
  "difficulty": "beginner",
  "estimated_minutes": 20,
  "icon_url": null,
  "is_published": true,
  "created_at": "2026-11-21T10:00:00+00:00"
}
```

`lesson` ma `id`, `course_id`, `title`, `description`, `order_index`, `xp_reward` i `is_published`. `activity` ma `id`, `lesson_id`, `title`, `activity_type` (`article`, `quiz` lub `video`), `order_index`, `xp_reward`, `coin_reward` i `estimated_minutes`.

### Treść i obrazy aktywności

Treść aktywności jest w `content`, a jej wersje językowe w `translations.<pl|en|de>.content`. Obraz ma postać:

```json
{"url":"/img/example.png","alt":"Opis alternatywny","caption":"Opcjonalny podpis"}
```

- `article`: używa `markdown`, opcjonalnego `reading_time_minutes` i opcjonalnego głównego `image`. Dodatkowe obrazy można osadzać jako osobne linie Markdown, np. `![Opis](/img/example.png)`.
- `quiz`: `content.questions[]` ma `id`, `prompt`, `options[]` oraz opcjonalny `image` w powyższej postaci. Poprawna odpowiedź `correct_option_id` i `explanation` pozostają wyłącznie w bazowej treści.
- `video`: zachowuje opis i metadane w `content`; sam MP4 jest w `activity_videos`.

Frontend wyświetla adresy obrazów zaczynające się od `/` albo pełne adresy `http(s)`. W danych tłumaczenia pytania i odpowiedzi zachowują te same identyfikatory.

## Stan aplikacji

### `GET /api/health`

Służy do prostego sprawdzenia, czy proces backendu działa. Nie przyjmuje danych ani nie wymaga sesji.

Odpowiedź `200`:

```json
{"status": "ok"}
```

### `GET /api/db-health`

Sprawdza połączenie z bazą przez `SELECT 1`. Nie przyjmuje danych ani nie wymaga sesji.

- `200`: `{"status":"ok"}`
- `503`: `{"status":"error"}`

## Autoryzacja i profil

### `GET /api/auth/google`

Rozpoczyna logowanie OAuth Google. Nie przyjmuje body. Odpowiedzią jest przekierowanie do Google, które po udanym logowaniu wraca na `/api/auth/google/callback` i ustawia ciasteczko sesji.

- `404`, gdy uruchomiono tryb `mock`;
- `503`, gdy nie ustawiono konfiguracji OAuth lub `SECRET_KEY`.

### `GET /api/auth/google/callback`

Endpoint wywoływany wyłącznie przez Google po logowaniu. Przyjmuje parametry OAuth w query stringu. Tworzy albo aktualizuje użytkownika i sesję, a następnie przekierowuje na `FRONTEND_URL` (domyślnie `/api/auth/me`). Nowe konto dostaje typ `user`; ponowne logowanie nie zmienia nadanego typu.

### `POST /api/auth/mock`

Loguje lokalne konto demonstracyjne. Działa wyłącznie, gdy backend uruchomiono z `--auth-mode mock`.

Wymagany nagłówek:

```http
X-Requested-With: XMLHttpRequest
```

Opcjonalne body JSON wybiera konto demonstracyjne danego typu (domyślnie `user`):

```json
{"role": "creator"}
```

Dozwolone wartości: `user`, `creator`, `partner`. Zwraca `200` z `{"status":"ok"}` i ustawia sesję; `400` dla nieznanego typu. W trybie Google zwraca `404`; bez wymaganego nagłówka `403`.

### `GET /api/auth/config`

Informuje frontend, który sposób logowania jest dostępny. Nie wymaga sesji.

Odpowiedź `200`:

```json
{"mode": "google", "roles": ["user", "creator", "partner"]}
```

`mode` to `google` albo `mock`.

### `GET /api/auth/me`

Zwraca profil bieżącego użytkownika. Wymaga sesji.

Odpowiedź `200`:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jan",
    "picture": "https://…",
    "preferred_language": "pl",
    "shark_coins": 25,
    "experience_points": 120,
    "role": "user",
    "created_at": "2026-11-21T10:00:00+00:00"
  }
}
```

`role` to typ konta: `user` (zalogowany), `creator` (twórca) albo `partner`. Bez sesji zwraca `401` — użytkownik jest wtedy niezalogowany.

### `POST /api/auth/preferences`

Zapisuje preferencję języka w profilu użytkownika. Nie zmienia języka treści kursu — ten zawsze wybiera `Accept-Language`.

Body JSON:

```json
{"preferred_language": "de"}
```

Dozwolone wartości: `pl`, `en`, `de`. Zwraca `200` z takim samym obiektem `user` jak `/api/auth/me`; `400` dla nieobsługiwanego języka, `401` bez sesji.

### `POST /api/auth/shop-purchase`

Kupuje przedmiot w sklepie i odejmuje jego cenę od salda SharkCoins zalogowanego użytkownika. Cena jest ustalana przez backend na podstawie identyfikatora produktu.

Body JSON:

```json
{"item_id": "hat-4"}
```

Obsługiwane przedmioty: `hat-4` (500 SC), `advice-discount` (7500 SC), `account-bonus` (6000 SC) i `investment-webinar` (5000 SC). Zwraca `200` z nowym saldem i pobranym kosztem. Zwraca `400` dla nieznanego przedmiotu, `401` bez sesji, `403` bez nagłówka AJAX lub `409`, gdy saldo jest niewystarczające.

### `POST /api/auth/logout`

Usuwa bieżącą sesję i czyści ciasteczko. Nie przyjmuje body. Wymaga nagłówka:

```http
X-Requested-With: XMLHttpRequest
```

Zwraca `200`: `{"status":"ok"}`. Bez nagłówka zwraca `403`.

## Kursy, lekcje i aktywności

### `GET /api/courses`

Zwraca opublikowane kursy. Opcjonalny query parameter `category` filtruje po dokładnej wartości kategorii.

Przykład: `GET /api/courses?category=investing`.

Odpowiedź `200`:

```json
{
  "courses": [
    {
      "id": 1,
      "slug": "podstawy-gieldy",
      "title": "Podstawy Giełdy",
      "total_activities": 3,
      "lessons_count": 1,
      "user_progress": {
        "enrolled": true,
        "completed_activities": 1,
        "total_activities": 3,
        "percentage": 33,
        "is_completed": false
      }
    }
  ]
}
```

`user_progress` występuje tylko przy ważnej sesji. Każdy kurs zawiera też pola z obiektu `course`.

### `GET /api/courses/:identifier`

Zwraca jeden opublikowany kurs. `identifier` może być numerycznym `id` albo `slug`.

Odpowiedź `200` zawiera `{"course": …}`. Poza polami `course` ma:

- `lessons`: opublikowane lekcje z ich listą aktywności;
- `total_activities`;
- dla zalogowanego użytkownika `user_progress`, jak na liście kursów;
- każda aktywność lekcji ma `is_completed` i `progress_status` (`not_started`, `started` lub `completed`), a każda lekcja `is_completed`.

`404` oznacza brak kursu albo kurs nieopublikowany.

### `POST /api/courses/:courseId/enroll`

Zapisuje zapis na opublikowany kurs. Nie przyjmuje body.

Odpowiedź:

```json
{"status":"ok","enrolled":true,"course_id":1,"persisted":true}
```

Bez sesji endpoint zwraca `200` z `persisted:false`: frontend powinien wtedy zachować zapis lokalnie. `404` oznacza brak opublikowanego kursu.

### `GET /api/lessons/:lessonId`

Zwraca opublikowaną lekcję oraz jej aktywności. Odpowiedź `200` ma formę:

```json
{
  "lesson": {
    "id": 10,
    "course_id": 1,
    "title": "Lekcja 1",
    "activities": [{"id": 100, "activity_type": "article", "is_completed": false, "progress_status": "not_started"}],
    "is_completed": false
  }
}
```

Aktywności nie zawierają tu pełnego `content`; pobierz je przez endpoint szczegółu aktywności. `404` oznacza brak lub nieopublikowaną lekcję.

### `GET /api/activities/:activityId`

Zwraca pełną treść aktywności. Nie wymaga sesji.

Odpowiedź `200`:

```json
{
  "activity": {
    "id": 100,
    "lesson_id": 10,
    "title": "Czym jest akcja?",
    "activity_type": "article",
    "xp_reward": 10,
    "coin_reward": 5,
    "content": {"markdown": "# Czym jest akcja?"},
    "user_progress": null
  }
}
```

- Dla `article`, `content` zawiera zwykle `markdown`, opcjonalnie `reading_time_minutes` oraz `image`. Obrazy w samym Markdown są zwracane jako zwykła treść tekstowa.
- Dla `quiz`, `content.questions` zawiera `id`, `prompt`, `options` oraz opcjonalnie `image`; poprawna odpowiedź nie jest zwracana przed wysłaniem quizu.
- Dla lokalnie przechowywanego `video`, `content` dostaje `video_url`, `video_filename`, `video_mime_type`, `video_size_bytes` i `video_language`. URL ma parametr `v`, który zmienia się po podmianie pliku, dzięki czemu może być bezpiecznie cache'owany przez przeglądarkę i CDN.
- `user_progress` występuje tylko dla zalogowanego użytkownika i ma pola: `status`, `quiz_score`, `passed`, `attempts_count`, `xp_earned`, `coins_earned`, `completed_at`.

### `POST /api/activities/:activityId/complete`

Oznacza artykuł albo film jako ukończony i nalicza nagrody tylko przy pierwszym ukończeniu. Nie przyjmuje body.

Odpowiedź `200`:

```json
{
  "status":"ok",
  "activity_id":100,
  "xp_earned":10,
  "coins_earned":5,
  "shark_coins":25,
  "experience_points":120,
  "is_first_completion":true,
  "lesson_completed":false,
  "course_completed":false,
  "persisted":true
}
```

Gość dostaje `persisted:false` i powinien zapisać wynik lokalnie. Dla `quiz` endpoint zwraca `400`; użyj `quiz-submit`. `404` oznacza brak aktywności.

### `POST /api/activities/:activityId/quiz-submit`

Sprawdza quiz, zapisuje postęp zalogowanego użytkownika i — przy pierwszym zaliczeniu — przyznaje XP oraz SharkCoiny.

Body JSON:

```json
{
  "answers": {
    "q1": "a",
    "q2": "b"
  }
}
```

Klucz to `id` pytania, a wartość to `id` wybranej opcji. Odpowiedź `200` zawiera `passed`, `score`, `passing_score`, `correct_count`, `total_questions`, `xp_earned`, `coins_earned`, `shark_coins`, `experience_points`, `is_first_completion`, `lesson_completed`, `course_completed`, `persisted` oraz `review`. Każdy element `review` ma `question_id`, `prompt`, `submitted_option`, `correct_option`, `is_correct` i `explanation`.

Gość otrzymuje wynik z `persisted:false`; dla niego `is_first_completion` jest zawsze `true`. `400` oznacza aktywność inną niż quiz, a `404` jej brak.

### `GET /api/user/progress`

Zwraca zagregowany postęp zalogowanego użytkownika. Wymaga sesji.

Odpowiedź `200`:

```json
{
  "progress": {
    "total_xp": 40,
    "experience_points": 40,
    "total_coins": 15,
    "shark_coins": 15,
    "completed_activities_count": 2,
    "enrolled_courses": [
      {
        "course_id": 1,
        "title": "Podstawy Giełdy",
        "slug": "podstawy-gieldy",
        "category": "investing",
        "difficulty": "beginner",
        "completed_activities": 2,
        "total_activities": 3,
        "percentage": 67,
        "is_completed": false,
        "enrolled_at": "2026-11-21T10:00:00+00:00"
      }
    ]
  }
}
```

`401` oznacza brak sesji.

### `POST /api/user/progress/sync`

Przenosi lokalny postęp gościa po zalogowaniu. Wymaga sesji.

Body JSON:

```json
{
  "enrolled_course_ids": [1, 2],
  "activities": [
    {
      "activity_id": 100,
      "status": "completed",
      "passed": true,
      "quiz_score": 100
    }
  ]
}
```

`enrolled_course_ids` i `activities` są opcjonalne. Dla pozycji aktywności domyślne wartości to `status:"completed"` i `passed:true`; `quiz_score` może być pominięte. Nieistniejące identyfikatory są pomijane.

Odpowiedź `200`:

```json
{
  "status":"ok",
  "synced_enrollments":1,
  "synced_activities":1,
  "total_new_xp":10,
  "total_new_coins":5
}
```

## Materiały wideo

### `GET /api/activities/:activityId/video`

Zwraca binarny plik MP4 dla aktywności typu `video`. Parametr query `language` przyjmuje `pl`, `en` lub `de`; gdy go nie ma, wybór następuje z `Accept-Language`. Brak `en` lub `de` powoduje fallback do polskiej wersji.

Odpowiedź `200` ma `Content-Type: video/mp4`, cache HTTP na rok (`Cache-Control: public, max-age=31536000, immutable`) i obsługuje żądania zakresów HTTP (odtwarzanie i przewijanie). Parametr `v` w URL-u jest wersją pliku, więc upload nowej wersji nie użyje starego cache'u. `400` oznacza zły język, `404` brak aktywności, zły typ albo brak pliku.

### `POST /api/activities/:activityId/video`

Wgrywa lub zastępuje MP4 przypisany do aktywności i języka. Wymaga ustawionego po stronie backendu `CONTENT_ADMIN_TOKEN` oraz nagłówka:

```http
X-Content-Admin-Token: <CONTENT_ADMIN_TOKEN>
```

Body to `multipart/form-data`:

- `video` — wymagany plik `.mp4`;
- `language` — opcjonalne `pl`, `en` lub `de`, domyślnie `pl`.

Backend odrzuca plik przekraczający `MAX_VIDEO_UPLOAD_BYTES` (domyślnie 100 MiB) i plik bez sygnatury kontenera MP4.

Odpowiedź `201` dla nowego pliku albo `200` dla zastąpionego:

```json
{
  "status":"ok",
  "activity_id":100,
  "video": {
    "url":"/api/activities/100/video?language=de",
    "language":"de",
    "filename":"lekcja-de.mp4",
    "mime_type":"video/mp4",
    "size_bytes":18432590
  }
}
```

`403` oznacza zły token, `503` brak konfiguracji tokenu, `400` zły język, rozszerzenie lub plik, a `404` brak aktywności.

## Czat Robert Biznesu

### `POST /api/chat/message`

Wysyła wiadomość do RAG/Gemini. Sesja jest opcjonalna; jeśli istnieje, chatbot użyje imienia użytkownika. 

Body JSON:

```json
{
  "message":"Czym jest ETF?",
  "voice":"Puck",
  "voice_enabled":true,
  "history":[{"role":"user","content":"Cześć"}]
}
```

Wymagane jest niepuste `message`. Opcjonalne: `voice` (domyślnie `Puck`), `voice_enabled` (domyślnie `false`) i `history` (domyślnie pusta lista). `history` jest obecnie przyjmowane dla zgodności z frontendem, ale nie wpływa jeszcze na odpowiedź modelu.

Odpowiedź `200` zawiera `reply`, `model`, `voice`, `voice_enabled`, `audio_base64` (albo `null`), `mime_type` (albo `null`), `sources` oraz `suggested_lessons`. Każda pozycja `suggested_lessons` ma `slug`, `title` i `category`. Puste `message` zwraca `400`.

### `GET /api/chat/voices`

Zwraca głosy dostępne dla TTS. Nie przyjmuje danych ani nie wymaga sesji.

Odpowiedź `200`: `{"voices":[…],"default_voice":"Puck","model":"gemini-3.8-flash-tts"}`.

### `POST /api/chat/tts`

Tworzy mowę z tekstu.

Body JSON:

```json
{"text":"Witaj", "voice":"Puck", "format":"audio"}
```

`text` jest wymagany. `voice` jest opcjonalny; `format` to `audio` (domyślnie) albo `json`.

- `format:"audio"` zwraca binarne audio ze `Content-Type` zwróconym przez usługę TTS;
- `format:"json"` zwraca `{"audio_base64":"…","mime_type":"…","voice":"Puck"}`.

Pusty tekst zwraca `400`.

### `GET /api/chat/knowledge`

Zwraca metadane wbudowanej bazy wiedzy RAG. Nie przyjmuje danych ani nie wymaga sesji.

Odpowiedź `200`: `{"count": 3, "topics": [{"id":"…","title":"…","category":"…","keywords":[…],"related_course_slug":"…"}]}`.

## Ranking

### `GET /api/ranking`

Ranking użytkowników posortowany malejąco po `experience_points`. Nie wymaga sesji. Zwraca tylko dane publiczne (bez e-maila). Ten sam wynik XP oznacza to samo miejsce (`1, 2, 2, 4`); w remisie wcześniej założone konto jest wyżej na liście. Poza trybem `mock` konta demonstracyjne są pomijane.

Parametr query `limit` (domyślnie `50`, zakres `1–100`).

Odpowiedź `200`:

```json
{
  "ranking": [
    {"rank": 1, "user_id": 7, "name": "Jan", "picture": "https://…", "experience_points": 340}
  ],
  "total_users": 12,
  "current_user": {"rank": 5, "user_id": 3, "name": "Ola", "picture": null, "experience_points": 120}
}
```

`current_user` to pozycja zalogowanego użytkownika (także spoza `limit`); dla gościa ma wartość `null`. `503` przy braku połączenia z bazą.

## Symulacja inwestowania

Symulacja nie jest obecnie zapisywana w bazie: jej sesja jest pamięcią procesu backendu. Do rozdzielenia sesji przekaż `X-Simulation-Session-Id` albo query parameter `session_id`. Bez nich używany jest wspólny klucz `default_user`; restart backendu kasuje wszystkie takie sesje.

Alokacje mają postać obiektu z kluczami `stocks`, `bonds`, `gold`, `cash`, np. `{"stocks":0.6,"bonds":0.2,"gold":0.1,"cash":0.1}`. Wartości są konwertowane do liczb nieujemnych i normalizowane tak, aby sumowały się do `1.0`; pusta alokacja oznacza 100% gotówki.

### `GET /api/simulation/events`

Zwraca listę scenariuszy: `events` z polami `id`, `order_index`, `title`, `period`, `total_quarters`, `starting_capital`, `initial_context`, oraz `data_sources` opisujące źródła danych rynkowych.

### `GET /api/simulation/events/:eventId`

Zwraca szczegóły scenariusza oraz bieżącą sesję dla podanego identyfikatora sesji:

```json
{"event": {"id":"gfc_2008", "…":"…"}, "active_session": null}
```

`event` zawiera dane z listy oraz `data_sources`. `active_session` jest obiektem stanu albo `null`. Nieistniejący scenariusz zwraca `404`.

### `POST /api/simulation/events/:eventId/start`

Rozpoczyna albo zastępuje sesję scenariusza. Body JSON jest opcjonalne:

```json
{
  "initial_capital": 10000,
  "allocations": {"stocks": 0.5, "bonds": 0.3, "gold": 0.1, "cash": 0.1}
}
```

`initial_capital` domyślnie bierze wartość scenariusza. Bez `allocations` sesja ma status `awaiting_initial_investment`; z alokacją — `in_progress`.

Odpowiedź `200` ma `status:"ok"`, `message` i `session`. Sesja zawiera m.in. `status`, `current_quarter_index`, `initial_capital`, `current_capital`, `allocations`, `history` i `total_quarters`.

### `POST /api/simulation/events/:eventId/invest`

Zatwierdza pierwszą alokację sesji. Wymaga wcześniej uruchomionego `/start` bez alokacji.

Body JSON:

```json
{"allocations":{"stocks":0.6,"bonds":0.2,"gold":0.1,"cash":0.1}}
```

Zwraca `200`: `{"status":"ok","session":{…}}`. `400` oznacza brak sesji, brak `allocations` albo próbę ponownego zatwierdzenia.

### `POST /api/simulation/events/:eventId/step-quarter`

Przechodzi o jeden kwartał i oblicza wynik portfela. Body JSON jest opcjonalne:

```json
{"new_allocations":{"stocks":0.4,"bonds":0.3,"gold":0.2,"cash":0.1}}
```

`new_allocations` wykonuje rebalancing przed obliczeniem kwartału. Odpowiedź `200`:

```json
{
  "status":"ok",
  "result": {
    "quarter_data": {"quarter":"2008-Q1", "portfolio_value":9500, "…":"…"},
    "is_finished":false,
    "current_capital":9500,
    "allocations":{"stocks":0.4,"bonds":0.3,"gold":0.2,"cash":0.1},
    "quarters_completed":1,
    "total_quarters":17
  },
  "full_session": {"…":"…"}
}
```

`quarter_data` zawiera zwroty, inflację, kontekst historyczny, lekcję i bieżące wartości. W ostatnim kroku `result.debrief` zawiera podsumowanie: zwrot nominalny i realny, maksymalne obsunięcie, liczbę rebalancingów, werdykt Roberta, wnioski, odznaki, `xp_awarded` i `sharcoins_awarded`.

`400` oznacza brak sesji lub brak zatwierdzonej alokacji. Dla już ukończonej sesji endpoint zwraca `200` z `status:"completed"` oraz bieżącą sesją.

### `POST /api/simulation/events/:eventId/reset`

Usuwa sesję danego scenariusza dla bieżącego `X-Simulation-Session-Id` / `session_id`. Nie przyjmuje body i zwraca `200`:

```json
{"status":"ok","message":"Zresetowano sesję dla eventu gfc_2008"}
```
