import base64
import unittest
from unittest.mock import patch, MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app import app
from database.models import Base, Course, Lesson, Activity
from services.gemini_service import GeminiService, PREBUILT_VOICES
from services.rag_service import RagService


class ChatApiTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        engine_patch = patch("database.engine", self.engine)
        engine_patch.start()
        self.addCleanup(engine_patch.stop)
        self.addCleanup(self.engine.dispose)

        self.client = app.test_client()
        previous_secret = app.secret_key
        app.secret_key = "test-secret"
        self.addCleanup(setattr, app, "secret_key", previous_secret)

        # Seed sample course and lessons
        with Session(self.engine) as db:
            self.course = Course(
                slug="inwestowanie-dla-rekinow",
                title="Inwestowanie dla Rekinów",
                description="Kompletny przewodnik po inwestowaniu",
                category="investing",
                difficulty="beginner",
            )
            db.add(self.course)
            db.commit()
            db.refresh(self.course)

            self.lesson = Lesson(
                course_id=self.course.id,
                title="Czym jest giełda i ETF?",
                description="Wprowadzenie do giełdy papierów wartościowych",
                order_index=1,
            )
            db.add(self.lesson)
            db.commit()
            db.refresh(self.lesson)

            self.activity = Activity(
                lesson_id=self.lesson.id,
                title="Wprowadzenie do ETF",
                activity_type="article",
                order_index=1,
                content={
                    "markdown": "# Czym jest ETF?\nETF to fundusz inwestycyjny notowany na giełdzie, naśladujący indeksy.",
                },
            )
            db.add(self.activity)
            db.commit()

    def test_get_voices(self):
        resp = self.client.get("/api/chat/voices")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("voices", data)
        self.assertGreaterEqual(len(data["voices"]), 5)
        voice_ids = [v["id"] for v in data["voices"]]
        self.assertIn("Puck", voice_ids)
        self.assertIn("Charon", voice_ids)
        self.assertIn("Kore", voice_ids)

    def test_get_knowledge(self):
        resp = self.client.get("/api/chat/knowledge")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("topics", data)
        self.assertGreaterEqual(data["count"], 5)

    def test_chat_message_empty(self):
        resp = self.client.post("/api/chat/message", json={"message": ""})
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertIn("error", data)

    def test_chat_message_success_fallback(self):
        resp = self.client.post(
            "/api/chat/message",
            json={
                "message": "Czym jest poduszka finansowa i ile powinna wynosić?",
                "voice": "Puck",
                "voice_enabled": False,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("reply", data)
        self.assertIn("sources", data)
        self.assertTrue(len(data["sources"]) > 0)
        top_source = data["sources"][0]
        self.assertIn("poduszka", top_source["title"].lower())
        self.assertIsNone(data["audio_base64"])

    def test_chat_message_with_voice(self):
        resp = self.client.post(
            "/api/chat/message",
            json={
                "message": "Jak działa procent składany?",
                "voice": "Puck",
                "voice_enabled": True,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("reply", data)
        self.assertTrue(data["voice_enabled"])
        self.assertIsNotNone(data["audio_base64"])
        # Verify base64 decode produces audio bytes (starts with RIFF for WAV)
        audio_bytes = base64.b64decode(data["audio_base64"])
        self.assertTrue(audio_bytes.startswith(b"RIFF"))

    def test_tts_endpoint_audio(self):
        resp = self.client.post(
            "/api/chat/tts",
            json={"text": "Witaj rekinie biznesu!", "voice": "Puck"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.content_type, "audio/wav")
        self.assertTrue(resp.data.startswith(b"RIFF"))

    def test_tts_endpoint_json(self):
        resp = self.client.post(
            "/api/chat/tts",
            json={"text": "Test syntezy mowy", "voice": "Kore", "format": "json"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("audio_base64", data)
        self.assertEqual(data["voice"], "Kore")

    def test_rag_retrieves_database_courses(self):
        rag = RagService(gemini_service=GeminiService(api_key=None))
        with Session(self.engine) as db:
            results = rag.retrieve("ETF fundusz na giełdzie", db=db, top_k=3)
            self.assertTrue(len(results) > 0)
            titles = [r["title"] for r in results]
            # Verify either curated or DB-sourced doc was matched
            self.assertTrue(any("etf" in t.lower() for t in titles))

    @patch("services.gemini_service.genai.Client")
    def test_gemini_service_with_mocked_api(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        # Mock interaction
        mock_interaction = MagicMock()
        mock_interaction.output_text = "Odpowiedź od gemini-4-hydrogen!"
        mock_client.interactions.create.return_value = mock_interaction

        service = GeminiService(api_key="real-test-api-key")
        self.assertTrue(service.is_available)

        resp = service.generate_chat_response(
            user_message="Jak zacząć inwestować?",
            context_chunks=[{"id": "c1", "title": "Podstawy", "category": "investing", "content": "..."}],
            user_name="Anna",
        )
        self.assertEqual(resp["reply"], "Odpowiedź od gemini-4-hydrogen!")
        self.assertIn("gemini", resp["model"])
        mock_client.interactions.create.assert_called_once()


if __name__ == "__main__":
    unittest.main()
