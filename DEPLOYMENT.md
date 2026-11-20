# Deploy z GitHub na Cloud Run

Backend i frontend są osobnymi usługami Cloud Run w regionie `us-east1`. Po jednorazowej konfiguracji każdy push do wybranej gałęzi GitHub buduje obraz w Cloud Build i wdraża nową rewizję. Wdrożenie nie korzysta z lokalnego pliku `.env`, Docker Compose ani klucza konta serwisowego z `backend/credentials/`.

## Przygotowanie projektu

Zaloguj się do Google Cloud i ustaw projekt:

```bash
gcloud auth login
gcloud config set project encoded-breaker-515313-h9
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com
```

Utwórz konto serwisowe dla backendu i daj mu dostęp do Cloud SQL oraz sekretów:

```bash
gcloud iam service-accounts create shark-finance-run --display-name="Shark Finance Cloud Run"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-run@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-run@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

W Secret Manager utwórz trzy sekrety: `shark-db-password`, `shark-flask-secret` i `shark-google-client-secret`. Każdy powinien zawierać tylko jedną wartość. Nie przesyłaj do Cloud Run ani do repozytorium pliku `database_credentials.json`.

Utwórz repozytorium Artifact Registry i konto używane przez Cloud Build. To konto buduje i wdraża obraz, ale **nie** dostaje poświadczeń do bazy ani sekretów aplikacji:

```bash
gcloud artifacts repositories create shark-finance \
  --repository-format=docker \
  --location=us-east1
gcloud iam service-accounts create shark-finance-build --display-name="Shark Finance Cloud Build"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
gcloud projects add-iam-policy-binding encoded-breaker-515313-h9 \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"
gcloud iam service-accounts add-iam-policy-binding \
  shark-finance-run@encoded-breaker-515313-h9.iam.gserviceaccount.com \
  --member="serviceAccount:shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## Automatyczne wdrożenia z GitHub

Połączone repozytorium GitHub wykorzystaj w Cloud Build > **Triggers**. Utwórz trigger backendu dla produkcyjnej gałęzi (np. `^main$`), wskazując konto `shark-finance-build@encoded-breaker-515313-h9.iam.gserviceaccount.com`. Trigger frontendu utwórz po poznaniu adresu API — potrzebuje substitution `_API_URL`.

| Trigger | Plik konfiguracji | Included files | Dodatkowa zmienna |
| --- | --- | --- | --- |
| `shark-finance-api` | `cloudbuild.backend.yaml` | `backend/**`, `cloudbuild.backend.yaml` | brak |
| `shark-finance-web` | `cloudbuild.frontend.yaml` | `frontend/**`, `cloudbuild.frontend.yaml` | `_API_URL=$API_URL` |

W drugim triggerze dodaj substitution `_API_URL` z adresem backendu uzyskanym wcześniej w zmiennej `API_URL`. Jest to publiczny adres, nie sekret; Dockerfile zapisuje go w buildzie jako `NEXT_PUBLIC_API_BASE_URL`. Frontendowy build przerywa się, jeżeli tej wartości brakuje lub nie zaczyna się od `https://`. Zmiany wyłącznie we frontendzie nie wdrożą backendu i odwrotnie.

## Pierwsze uruchomienie z GitHub

Nie uruchamiaj `gcloud run deploy --source` z lokalnego katalogu. W Cloud Build ręcznie uruchom najpierw trigger `shark-finance-api` (przycisk **Run**). Pobierze on kod z GitHub, zbuduje [backend/Dockerfile](/home/jakub-samek/Rekiny-Roberta-Collabothon-2026/backend/Dockerfile) i utworzy usługę.

Następnie przypisz do niej konfigurację runtime oraz połączenie Cloud SQL. Cloud Run montuje socket pod `/cloudsql/...`; aplikacja buduje z niego adres bazy przez `INSTANCE_UNIX_SOCKET`, `DB_USER`, `DB_NAME` i sekret `DB_PASSWORD`.

```bash
gcloud run services update shark-finance-api \
  --region us-east1 \
  --execution-environment gen2 \
  --service-account shark-finance-run@encoded-breaker-515313-h9.iam.gserviceaccount.com \
  --add-cloudsql-instances encoded-breaker-515313-h9:us-east1:shark-finance-db \
  --update-env-vars INSTANCE_UNIX_SOCKET=/cloudsql/encoded-breaker-515313-h9:us-east1:shark-finance-db,DB_NAME=postgres,DB_USER=postgres,COOKIE_SECURE=true,COOKIE_SAMESITE=None \
  --update-secrets DB_PASSWORD=shark-db-password:latest,SECRET_KEY=shark-flask-secret:latest,GOOGLE_CLIENT_SECRET=shark-google-client-secret:latest
```

Uruchom jednorazowo inicjalizację tabel z obrazu zbudowanego przez trigger:

```bash
API_URL=$(gcloud run services describe shark-finance-api --region us-east1 --format='value(status.url)')
API_IMAGE=$(gcloud run services describe shark-finance-api --region us-east1 --format='value(spec.template.spec.containers[0].image)')
gcloud run jobs deploy shark-finance-init-db \
  --image="$API_IMAGE" \
  --region us-east1 \
  --service-account shark-finance-run@encoded-breaker-515313-h9.iam.gserviceaccount.com \
  --add-cloudsql-instances encoded-breaker-515313-h9:us-east1:shark-finance-db \
  --command flask --args=--app,app,init-db \
  --set-env-vars INSTANCE_UNIX_SOCKET=/cloudsql/encoded-breaker-515313-h9:us-east1:shark-finance-db,DB_NAME=postgres,DB_USER=postgres \
  --set-secrets DB_PASSWORD=shark-db-password:latest
gcloud run jobs execute shark-finance-init-db --region us-east1 --wait
```

`init-db` tworzy brakujące tabele; nie wykonuje migracji zmienionych tabel.

Po ustawieniu `_API_URL=$API_URL` ręcznie uruchom trigger `shark-finance-web`. Dopiero wtedy frontend zostanie zbudowany z prawidłowym adresem backendu. Pobierz jego adres i skonfiguruj OAuth:

```bash
WEB_URL=$(gcloud run services describe shark-finance-web --region us-east1 --format='value(status.url)')
gcloud run services update shark-finance-api \
  --region us-east1 \
  --update-env-vars FRONTEND_URL=$WEB_URL,FRONTEND_ORIGIN=$WEB_URL,GOOGLE_CLIENT_ID=TWOJ_GOOGLE_CLIENT_ID,GOOGLE_REDIRECT_URI=$API_URL/api/auth/google/callback
```

Dodaj dokładnie `$API_URL/api/auth/google/callback` do **Authorized redirect URIs** klienta OAuth w Google Cloud. `COOKIE_SAMESITE=None` jest wymagane, gdy frontend i API są na osobnych adresach Cloud Run; działa tylko z `COOKIE_SECURE=true`. Dla docelowej aplikacji użyj własnych domen, na przykład `app.twojadomena.pl` oraz `api.twojadomena.pl`; następnie zaktualizuj `FRONTEND_URL`, `FRONTEND_ORIGIN`, callback OAuth i substitution `_API_URL` triggera frontendowego.

Po wdrożeniu sprawdź `GET $API_URL/api/health` i `GET $API_URL/api/db-health`, a następnie logowanie przez `GET $API_URL/api/auth/google`.

Jeżeli plik `database_credentials.json` został wypchnięty do GitHuba choć raz, usuń go z historii i natychmiast unieważnij klucz konta usługi. W aktualnym katalogu jest ignorowany przez Git i nie jest śledzony.
