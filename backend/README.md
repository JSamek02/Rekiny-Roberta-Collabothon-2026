# Backend

API we Flasku z bazą PostgreSQL w Google Cloud SQL. Docker Compose uruchamia Cloud SQL Auth Proxy; API działa lokalnie.

## Struktura

- `app.py` — konfiguracja aplikacji i rejestracja modułów API.
- `api/` — widoki klasowe endpointów podzielone według funkcjonalności (`auth.py`, `health.py`). Kolejne funkcjonalności mogą mieć własne moduły i blueprinty.
- `database/models.py` — modele SQLAlchemy: użytkownik, sesja, preferencja języka i saldo SharkCoinów.
- `database/` — połączenie z PostgreSQL i inicjalizacja tabel na podstawie modeli. `schema.sql` dokumentuje pierwotny schemat.
- `tests/` — testy backendu.
- `input/` — materiały opisujące projekt.
- `.example.env` — szablon lokalnej konfiguracji; `.env` zawiera lokalne ustawienia i nie jest zapisywany w Git.

## Uruchomienie

W katalogu `backend`:

```bash
cp -n .example.env .env  # przy pierwszym uruchomieniu
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
gcloud auth application-default login
docker compose up -d
flask --app app init-db
flask --app app run --debug
```

Przed uruchomieniem skonfiguruj połączenie z Cloud SQL zgodnie z sekcją poniżej. Przed logowaniem Google uzupełnij też `SECRET_KEY`, `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` w `.env`. Wygeneruj klucz poleceniem `python -c 'import secrets; print(secrets.token_hex(32))'` i wklej go jako `SECRET_KEY`; zachowaj go między restartami. Aplikacja wczytuje `backend/.env` przy uruchomieniu przez Flask i `python app.py`. Zmienne ustawione w środowisku mają pierwszeństwo przed wartościami z pliku.

API jest dostępne pod adresem `http://127.0.0.1:5000`:

- `GET /api/health` — sprawdza, czy API działa.
- `GET /api/db-health` — sprawdza połączenie z bazą; zwraca 503, gdy baza jest niedostępna.
- `POST /api/chat/message` — czat z Robertem Biznesu oparty o RAG i Google Gemini API (`gemini-4-hydrogen`), z opcjonalną syntezą mowy (`gemini-3.8-flash-tts`).
- `GET /api/chat/voices` — lista dostępnych głosów Gemini TTS (np. Puck, Charon, Kore, Aoede, Zephyr).
- `POST /api/chat/tts` — bezpośrednia synteza mowy dowolnego tekstu do `audio/wav`.
- `GET /api/chat/knowledge` — podgląd zaindeksowanych tematów finansowych w bazie RAG.

## Cloud SQL

Compose uruchamia Cloud SQL Auth Proxy dla instancji `encoded-breaker-515313-h9:us-east1:shark-finance-db`. Proxy nasłuchuje tylko lokalnie na `127.0.0.1:5433` i szyfruje połączenie z Google. Dotychczasowy wolumen lokalnego PostgreSQL nie jest usuwany ani automatycznie kopiowany do Cloud SQL.

1. Zainstaluj [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), a następnie wykonaj `gcloud auth application-default login`. Konto Google musi mieć dostęp do instancji, m.in. rolę Cloud SQL Client; projekt musi mieć włączone Cloud SQL Admin API.
2. W `.env` ustaw `CLOUD_SQL_CREDENTIALS_FILE` na ścieżkę do pliku Application Default Credentials. Domyślna ścieżka na Linuksie to `${HOME}/.config/gcloud/application_default_credentials.json`. Proxy odczytuje ten plik w kontenerze jako użytkownik o identyfikatorach `CLOUD_SQL_PROXY_UID` i `CLOUD_SQL_PROXY_GID` — domyślnie `1000:1000`. Jeśli właściciel pliku ma inne identyfikatory, wpisz do `.env` wyniki `id -u` i `id -g`.
3. W `.env` ustaw `DATABASE_URL` na `postgresql://UZYTKOWNIK:HASLO@127.0.0.1:5433/NAZWA_BAZY`, podając istniejącą bazę, nazwę użytkownika i hasło PostgreSQL w Cloud SQL. Dane logowania Google służą proxy; użytkownik i hasło bazy są osobne. Znaki specjalne w nazwie użytkownika lub haśle zakoduj dla URL, np. `@` jako `%40`.
4. Uruchom `docker compose up -d`. Po starcie API endpoint `GET /api/db-health` sprawdzi połączenie. Diagnostyka proxy: `docker compose logs cloud-sql-proxy`.

Jeśli działa stary kontener `postgres` z poprzedniej konfiguracji, może nadal działać jako osierocony kontener. Zatrzymaj go osobno, gdy nie będzie potrzebny; nie usuwaj jego wolumenu, jeśli są tam potrzebne dane.

Polecenie `init-db` tworzy brakujące tabele, uzupełnia istniejącą tabelę `users` o pola `preferred_language` oraz `shark_coins`, a tabele kursów, lekcji i aktywności o `translations`. Dla istniejących użytkowników saldo jest jednorazowo wyliczane z dotychczas zdobytych monet.

Testy: `python -m unittest`. Testy operacji na użytkownikach używają bazy SQLite w pamięci.

## Tryb demonstracyjny bez Google

Po uruchomieniu proxy, instalacji zależności i wykonaniu `flask --app app init-db`, uruchom aplikację z flagą:

```bash
python app.py --auth-mode mock --debug
```

W tym trybie `POST /api/auth/mock` loguje na stałe konto demonstracyjne i tworzy zwykłą sesję w PostgreSQL. Konto jest tworzone automatycznie przy pierwszym logowaniu. Nie są potrzebne dane Google ani `SECRET_KEY`. Wyślij nagłówek `X-Requested-With: XMLHttpRequest`, na przykład:

```bash
curl -c /tmp/collabothon-cookies.txt -X POST -H 'X-Requested-With: XMLHttpRequest' http://localhost:5000/api/auth/mock
curl -b /tmp/collabothon-cookies.txt http://localhost:5000/api/auth/me
```

Następnie można korzystać z `GET /api/auth/me` i `POST /api/auth/logout` tak samo jak w trybie Google. Wszyscy korzystający z trybu mock współdzielą jedno konto i jego dane. Korzystaj z niego tylko lokalnie, na danych testowych: nie wymaga żadnego uwierzytelnienia. Po przełączeniu na Google sesje konta demonstracyjnego nie są akceptowane.

Domyślnym trybem jest Google: `python app.py --auth-mode google` lub dotychczasowe `flask --app app run --debug`. W tym trybie endpoint mock jest wyłączony; w trybie mock wyłączone są endpointy logowania Google.

## Logowanie Google

1. W [Google Cloud Console](https://console.cloud.google.com/) skonfiguruj ekran zgody OAuth i utwórz klienta OAuth typu **Web application**. Jeśli aplikacja jest w trybie testowym, dodaj swoje konto do użytkowników testowych.
2. Do dozwolonych adresów przekierowania klienta dodaj dokładnie `http://localhost:5000/api/auth/google/callback` (adres musi być identyczny z używanym przez aplikację).
3. Uzupełnij `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` i `SECRET_KEY` w `backend/.env`, a następnie uruchom ponownie Flask. Bez nich endpoint logowania zwraca 503. Nie umieszczaj pliku `.env` w repozytorium.

4. Otwórz w przeglądarce `http://localhost:5000/api/auth/google`. Przy pierwszym logowaniu konto jest automatycznie tworzone, a przy kolejnych rozpoznawane po stałym identyfikatorze Google. Domyślnie po zalogowaniu następuje przekierowanie na `/api/auth/me`.

Endpointy:

- `GET /api/auth/google` — rozpoczęcie logowania; przekierowanie przeglądarki do Google.
- `GET /api/auth/google/callback` — powrót z Google, obsługiwany przez backend.
- `GET /api/auth/me` — bieżący użytkownik (`401`, jeśli brak ważnej sesji).
- `POST /api/auth/preferences` — zapisuje preferowany język użytkownika: `pl`, `en` albo `de`.
- `POST /api/auth/logout` — unieważnienie bieżącej sesji; wymagany nagłówek `X-Requested-With: XMLHttpRequest`.

Przykład zapisu języka dla zalogowanego użytkownika:

```js
await fetch('/api/auth/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ preferred_language: 'de' }),
});
```

`GET /api/auth/me` zwraca też `preferred_language` oraz bieżące `shark_coins`. Monety są zwiększane wyłącznie przy pierwszym zaliczeniu aktywności lub podczas importu nowego postępu z lokalnego magazynu.

## Język treści

Język odpowiedzi dla kursów, lekcji i aktywności jest wybierany wyłącznie z nagłówka `Accept-Language`, niezależnie od `preferred_language` w profilu. Backend obsługuje `pl`, `en` i `de`, także wraz z regionem, np. `de-DE`. Wybiera pierwszy obsługiwany język o dodatnim priorytecie; przy braku dopasowania zwraca polską treść.

Dotyczy to:

- `GET /api/courses`;
- `GET /api/courses/:id-lub-slug`;
- `GET /api/lessons/:lessonId`;
- `GET /api/activities/:activityId`;
- `POST /api/activities/:activityId/quiz-submit` — lokalizuje tekst omówienia odpowiedzi;
- `GET /api/user/progress` — lokalizuje nazwy kursów.

Polski tekst nadal znajduje się w głównych kolumnach. Tłumaczenia zapisuj w JSON-ie `translations` danego rekordu:

```json
{
  "en": {
    "title": "Stock market basics",
    "description": "Learn the essentials of investing."
  },
  "de": {
    "title": "Grundlagen der Börse",
    "description": "Lerne die Grundlagen des Investierens."
  }
}
```

Dla aktywności obiekt języka może również zawierać pełne `content`; w ten sposób tłumaczy się artykuł, adres wideo lub pytania quizu:

```json
{
  "de": {
    "title": "Was ist eine Aktie?",
    "content": {
      "questions": [
        {
          "id": "q1",
          "prompt": "Was bedeutet der Besitz einer Aktie?",
          "options": [{"id": "a", "text": "Anteil am Unternehmen"}],
          "explanation": "Eine Aktie steht für einen Eigentumsanteil."
        }
      ]
    }
  }
}
```

Identyfikatory pytań i opcji muszą pozostać takie same jak w polskiej treści. Poprawne odpowiedzi oraz próg zaliczenia pozostają w bazowej polskiej strukturze, więc ocena quizu nie zależy od języka klienta.

Przykład wylogowania z frontendu pod tym samym originem:

```js
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});
```

Sesja trwa siedem dni. Jej losowy identyfikator znajduje się w ciasteczku HttpOnly, a w bazie przechowywany jest tylko jego skrót. Backend nie przechowuje tokenów Google. Frontend powinien korzystać z tego samego originu co API, np. przez proxy serwera developerskiego; CORS nie jest skonfigurowany. Używaj konsekwentnie `localhost`, a nie zamiennie `127.0.0.1`, żeby ciasteczka działały poprawnie.

Opcjonalnie `FRONTEND_URL` określa stały adres przekierowania po logowaniu, a `GOOGLE_REDIRECT_URI` zmienia adres callbacku (musi być również zarejestrowany w Google). W środowisku HTTPS ustaw `COOKIE_SECURE=true` i używaj adresu callbacku HTTPS. Szczegóły konfiguracji OAuth opisuje [dokumentacja Google](https://developers.google.com/identity/openid-connect/openid-connect).

## Chatbot Robert Biznesu & Google Gemini API (RAG + Voice TTS)

Moduł czatu finansowego wykorzystuje oficjalny pakiet `google-genai` (wersja >= 3.2.0):

- **Model konwersacyjny:** `gemini-4-hydrogen` — inteligentny, szybki model zoptymalizowany pod kątem edukacji finansowej.
- **Silnik RAG (Retrieval-Augmented Generation):**
  - Wektoryzacja semantyczna z użyciem `gemini-embedding-2` (z hybrydowym wyszukiwaniem leksykalnym i bezpiecznym fallbackiem).
  - Wyszukiwanie w kuratorowanej Bazie Wiedzy (poduszka finansowa, reguła 50/30/20, akcje vs obligacje, ETF-y, procent składany, inflacja, IKE/IKZE, psychologia inwestowania).
  - Dynamiczne pobieranie i indeksowanie lekcji oraz artykułów bezpośrednio z bazy danych PostgreSQL.
  - Zwracanie źródeł (cytowań) oraz rekomendowanych lekcji na platformie powiązanych z pytaniem użytkownika.
- **Czat głosowy & TTS:**
  - `gemini-3.8-flash-tts` — ekspresyjna synteza mowy w formacie WAV.
  - Wybór głosu spośród katalogu głosów Gemini (`Puck`, `Charon`, `Kore`, `Aoede`, `Zephyr`, `Fenrir`, `Achird`, `Sadaltager`).

### Konfiguracja klucza API

W pliku `backend/.env` ustaw:
```bash
GEMINI_API_KEY=twoj_klucz_gemini_api
```
*(Gdy klucz nie jest ustawiony, moduł automatycznie działa w trybie demonstracyjnym z syntetycznym dźwiękiem WAV i odpowiedziami z bazy wiedzy, dzięki czemu testy i demonstracja działają bez przeszkód).*
