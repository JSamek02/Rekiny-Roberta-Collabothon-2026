import base64
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


class ChatMessageView(MethodView):
    """POST /api/chat/message — generates a RAG-grounded chat reply.

    Expected JSON: ``message`` (required), plus optional ``voice`` (default
    ``Puck``), ``voice_enabled`` (default ``false``), and conversational
    ``history``. The response contains ``reply``, model name, sources,
    suggested lessons and, when voice is enabled, Base64 audio plus its MIME
    type. An empty message returns 400; this endpoint is otherwise public.
    """

    def post(self):
        data = request.get_json(silent=True) or {}
        user_message = (data.get("message") or "").strip()
        if not user_message:
            return jsonify({"error": "Wiadomość nie może być pusta"}), 400

        voice = data.get("voice", "Puck")
        voice_enabled = bool(data.get("voice_enabled", False))
        history = data.get("history", [])

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
    """GET /api/chat/voices — returns the supported TTS voice catalogue.

    The public JSON response is ``{\"voices\": [...], \"default_voice\":
    \"Puck\", \"model\": \"gemini-3.8-flash-tts\"}``.
    """

    def get(self):
        voices = gemini_service.get_voices()
        return jsonify({
            "voices": voices,
            "default_voice": "Puck",
            "model": "gemini-3.8-flash-tts",
        }), 200


class ChatTTSView(MethodView):
    """POST /api/chat/tts — synthesizes text with the selected voice.

    Expected JSON: required ``text`` and optional ``voice`` (default ``Puck``)
    and ``format``. The default ``format: \"audio\"`` returns an ``audio/wav``
    response body; ``format: \"json\"`` returns ``audio_base64``, ``mime_type``
    and ``voice``. Missing or blank text returns 400.
    """

    def post(self):
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Brak tekstu do syntezy"}), 400

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
    """GET /api/chat/knowledge — lists public RAG knowledge-base metadata.

    Returns ``{\"count\": number, \"topics\": [...]}``; each topic includes its
    ID, title, category, keywords, and optional related course slug. It does
    not expose the full source-document content.
    """

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
