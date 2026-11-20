import unittest
from unittest.mock import patch

import psycopg

from app import app


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})

    @patch("app.psycopg.connect")
    def test_database_health(self, connect):
        response = self.client.get("/api/db-health")
        self.assertEqual(response.status_code, 200)
        connect.return_value.__enter__.return_value.execute.assert_called_once_with("SELECT 1")

    @patch("app.psycopg.connect", side_effect=psycopg.OperationalError("unavailable"))
    def test_database_unavailable(self, connect):
        response = self.client.get("/api/db-health")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json(), {"status": "error"})


if __name__ == "__main__":
    unittest.main()
