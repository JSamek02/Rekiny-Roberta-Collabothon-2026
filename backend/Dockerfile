FROM python:3.12.3-slim

WORKDIR /app

# Zapobiega zapisywaniu plików .pyc i buforowaniu wyjścia
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Cloud Run przekazuje port w zmiennej PORT.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 8 app:app"]
