import base64
import collections
import threading
import time
from typing import Any, Dict, List
from flask import Blueprint, jsonify, request, Response
from flask.views import MethodView

from api.auth import get_authenticated_user
from database import database
from services.gemini_service import GeminiService
from services.rag_service import RagService


chat = Blueprint("chat", __name__, url_prefix="/api/chat")

# Global singleton services
gemini_service = GeminiService()
rag_service = RagService(gemini_service)

# Security & Quota Constants
MAX_MESSAGE_LENGTH = 1000
MAX_TTS_TEXT_LENGTH = 500
MAX_HISTORY_ITEMS = 8


class SimpleRateLimiter:
    """Thread-safe in-memory sliding window rate limiter per client IP."""
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = collections.defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            history = self._requests[client_id]
            # Prune timestamps older than the sliding window
            self._requests[client_id] = [t for t in history if t > cutoff]
            if len(self._requests[client_id]) >= self.max_requests:
                return False
            self._requests[client_id].append(now)
            return True


# Rate limiters: 30 chat messages/min, 12 TTS requests/min per IP
chat_limiter = SimpleRateLimiter(max_requests=30, window_seconds=60)
tts_limiter = SimpleRateLimiter(max_requests=12, window_seconds=60)


def get_client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "127.0.0.1"


class ChatMessageView(MethodView):
    def post(self):
        client_ip = get_client_ip()
        if not chat_limiter.is_allowed(client_ip):
            return jsonify({
                "error": "Zbyt wiele zapytań w krótkim czasie. Zwolnij trochę, Rekinie! Odczekaj chwilę."
            }), 429

        data = request.get_json(silent=True) or {}
        user_message = (data.get("message") or "").strip()
        if not user_message:
            return jsonify({"error": "Wiadomość nie może być pusta"}), 400

        if len(user_message) > MAX_MESSAGE_LENGTH:
            return jsonify({
                "error": f"Wiadomość jest zbyt długa (maksymalnie {MAX_MESSAGE_LENGTH} znaków)"
            }), 400

        voice = data.get("voice", "Puck")
        voice_enabled = bool(data.get("voice_enabled", False))
        raw_history = data.get("history", [])

        # Sanitize and truncate history
        history: List[Dict[str, str]] = []
        if isinstance(raw_history, list):
            for item in raw_history[-MAX_HISTORY_ITEMS:]:
                if isinstance(item, dict):
                    role = item.get("role", "user")
                    text = str(item.get("text", ""))[:MAX_MESSAGE_LENGTH]
                    history.append({"role": role, "text": text})

        user_name = None
        try:
            with database() as db:
                user = get_authenticated_user(db)
                if user and user.name:
                    user_name = user.name

                # Retrieve relevant financial context chunks from RAG (Curated + Database courses)
                retrieved_chunks = rag_service.retrieve(query=user_message, db=db, top_k=3)
        except Exception as e:
            print(f"[ChatMessageView] DB lookup error: {e}")
            retrieved_chunks = rag_service.retrieve(query=user_message, db=None, top_k=3)

        # Generate grounded response using gemini-4-hydrogen
        response_data = gemini_service.generate_chat_response(
            user_message=user_message,
            context_chunks=retrieved_chunks,
            conversation_history=history,
            user_name=user_name,
        )

        reply_text = response_data.get("reply", "")

        # Extract suggested courses/lessons from retrieved chunks
        suggested_lessons = []
        seen_slugs = set()
        for chunk in retrieved_chunks:
            slug = chunk.get("related_course_slug")
            if slug and slug not in seen_slugs:
                seen_slugs.add(slug)
                suggested_lessons.append({
                    "slug": slug,
                    "title": chunk.get("title"),
                    "category": chunk.get("category"),
                })

        audio_base64 = None
        mime_type = None
        if voice_enabled and reply_text:
            try:
                # Generate audio using gemini-3.8-flash-tts
                audio_bytes, mime_type = gemini_service.generate_speech(reply_text, voice=voice)
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            except Exception as e:
                print(f"[ChatMessageView] Speech synthesis error: {e}")

        return jsonify({
            "reply": reply_text,
            "model": response_data.get("model", "gemini-4-hydrogen"),
            "voice": voice,
            "voice_enabled": voice_enabled,
            "audio_base64": audio_base64,
            "mime_type": mime_type,
            "sources": response_data.get("sources", []),
            "suggested_lessons": suggested_lessons,
        }), 200


class ChatVoicesView(MethodView):
    def get(self):
        voices = gemini_service.get_voices()
        return jsonify({
            "voices": voices,
            "default_voice": "Puck",
            "model": "gemini-3.8-flash-tts",
        }), 200


class ChatTTSView(MethodView):
    def post(self):
        client_ip = get_client_ip()
        if not tts_limiter.is_allowed(client_ip):
            return jsonify({
                "error": "Zbyt wiele żądań syntezy głosu. Poczekaj chwilę przed kolejnym odtworzeniem."
            }), 429

        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Brak tekstu do syntezy"}), 400

        if len(text) > MAX_TTS_TEXT_LENGTH:
            return jsonify({
                "error": f"Tekst do syntezy jest zbyt długi (maksymalnie {MAX_TTS_TEXT_LENGTH} znaków)"
            }), 400

        voice = data.get("voice", "Puck")
        format_type = data.get("format", "audio")  # "audio" stream or "json" base64

        audio_bytes, mime_type = gemini_service.generate_speech(text, voice=voice)

        if format_type == "json":
            return jsonify({
                "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
                "mime_type": mime_type,
                "voice": voice,
            })

        return Response(audio_bytes, mimetype=mime_type)


class ChatKnowledgeView(MethodView):
    def get(self):
        curated = [
            {
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "keywords": doc["keywords"],
                "related_course_slug": doc.get("related_course_slug"),
            }
            for doc in rag_service._curated_docs
        ]
        return jsonify({
            "count": len(curated),
            "topics": curated,
        }), 200


chat.add_url_rule("/message", view_func=ChatMessageView.as_view("message"))
chat.add_url_rule("/voices", view_func=ChatVoicesView.as_view("voices"))
chat.add_url_rule("/tts", view_func=ChatTTSView.as_view("tts"))
chat.add_url_rule("/knowledge", view_func=ChatKnowledgeView.as_view("knowledge"))
