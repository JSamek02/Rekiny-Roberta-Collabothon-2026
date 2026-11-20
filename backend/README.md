# Backend

Prosty szablon API we Flasku z bazą PostgreSQL. Docker Compose uruchamia samą bazę; API działa lokalnie.

## Struktura

- `app.py` — konfiguracja aplikacji i rejestracja modułów API.
- `api/` — widoki klasowe endpointów podzielone według funkcjonalności (`auth.py`, `health.py`). Kolejne funkcjonalności mogą mieć własne moduły i blueprinty.
- `database/models.py` — modele SQLAlchemy: użytkownik i sesja logowania.
- `database/` — połączenie z PostgreSQL i inicjalizacja tabel na podstawie modeli. `schema.sql` dokumentuje pierwotny schemat.
- `tests/` — testy backendu.
- `input/` — materiały opisujące projekt.
- `.example.env` — szablon lokalnej konfiguracji; `.env` zawiera lokalne ustawienia i nie jest zapisywany w Git.

## Uruchomienie

W katalogu `backend`:

```bash
cp -n .example.env .env  # przy pierwszym uruchomieniu
docker compose up -d
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app init-db
flask --app app run --debug
```

Przed logowaniem Google uzupełnij `SECRET_KEY`, `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` w `.env`. Wygeneruj klucz poleceniem `python -c 'import secrets; print(secrets.token_hex(32))'` i wklej go jako `SECRET_KEY`; zachowaj go między restartami. Aplikacja wczytuje `backend/.env` przy uruchomieniu przez Flask i `python app.py`. Zmienne ustawione w środowisku mają pierwszeństwo przed wartościami z pliku.

API jest dostępne pod adresem `http://127.0.0.1:5000`:

- `GET /api/health` — sprawdza, czy API działa.
- `GET /api/db-health` — sprawdza połączenie z bazą; zwraca 503, gdy baza jest niedostępna.

Domyślny adres bazy to `postgresql://app:app@localhost:5432/app`. Można go zmienić przez zmienną środowiskową `DATABASE_URL`. Dane logowania w `compose.yaml` służą wyłącznie do lokalnego developmentu. Dane PostgreSQL są zachowywane w wolumenie Dockera; `docker compose down` zatrzymuje i usuwa kontener, ale nie usuwa wolumenu.

Polecenie `init-db` tworzy brakujące tabele na podstawie modeli ORM, ale nie zmienia już istniejących tabel. Zmiany istniejącego schematu wymagają migracji.

Testy: `python -m unittest`. Testy operacji na użytkownikach używają bazy SQLite w pamięci.

## Tryb demonstracyjny bez Google

Po uruchomieniu PostgreSQL, instalacji zależności i wykonaniu `flask --app app init-db`, uruchom aplikację z flagą:

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
- `POST /api/auth/logout` — unieważnienie bieżącej sesji; wymagany nagłówek `X-Requested-With: XMLHttpRequest`.

Przykład wylogowania z frontendu pod tym samym originem:

```js
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});
```

Sesja trwa siedem dni. Jej losowy identyfikator znajduje się w ciasteczku HttpOnly, a w bazie przechowywany jest tylko jego skrót. Backend nie przechowuje tokenów Google. Frontend powinien korzystać z tego samego originu co API, np. przez proxy serwera developerskiego; CORS nie jest skonfigurowany. Używaj konsekwentnie `localhost`, a nie zamiennie `127.0.0.1`, żeby ciasteczka działały poprawnie.

Opcjonalnie `FRONTEND_URL` określa stały adres przekierowania po logowaniu, a `GOOGLE_REDIRECT_URI` zmienia adres callbacku (musi być również zarejestrowany w Google). W środowisku HTTPS ustaw `COOKIE_SECURE=true` i używaj adresu callbacku HTTPS. Szczegóły konfiguracji OAuth opisuje [dokumentacja Google](https://developers.google.com/identity/openid-connect/openid-connect).
