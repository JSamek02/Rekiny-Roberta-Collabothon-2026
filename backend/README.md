# Backend

Prosty szablon API we Flasku z bazą PostgreSQL. Docker Compose uruchamia samą bazę; API działa lokalnie.

## Uruchomienie

W katalogu `backend`:

```bash
docker compose up -d
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

API jest dostępne pod adresem `http://127.0.0.1:5000`:

- `GET /api/health` — sprawdza, czy API działa.
- `GET /api/db-health` — sprawdza połączenie z bazą; zwraca 503, gdy baza jest niedostępna.

Domyślny adres bazy to `postgresql://app:app@localhost:5432/app`. Można go zmienić przez zmienną środowiskową `DATABASE_URL`. Dane logowania w `compose.yaml` służą wyłącznie do lokalnego developmentu. Dane PostgreSQL są zachowywane w wolumenie Dockera; `docker compose down` zatrzymuje i usuwa kontener, ale nie usuwa wolumenu.

Testy: `python -m unittest`.
