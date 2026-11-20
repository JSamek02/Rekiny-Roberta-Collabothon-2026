import base64
import io
import math
import os
import struct
import wave
from typing import Any, Dict, List, Optional, Tuple

from google import genai


PREBUILT_VOICES = [
    {
        "id": "Puck",
        "name": "Puck",
        "style": "Upbeat",
        "description": "Energiczny, optymistyczny i dynamiczny — oficjalny głos Roberta Biznesu!",
        "gender": "male",
        "recommended": True,
    },
    {
        "id": "Charon",
        "name": "Charon",
        "style": "Informative",
        "description": "Spokojny, precyzyjny, analityczny mentor finansowy.",
        "gender": "male",
        "recommended": False,
    },
    {
        "id": "Aoede",
        "name": "Aoede",
        "style": "Breezy",
        "description": "Swobodny, ciepły i naturalny głos doradczy.",
        "gender": "female",
        "recommended": False,
    },
    {
        "id": "Kore",
        "name": "Kore",
        "style": "Firm",
        "description": "Zdecydowany, wyrazisty i profesjonalny.",
        "gender": "female",
        "recommended": False,
    },
    {
        "id": "Zephyr",
        "name": "Zephyr",
        "style": "Bright",
        "description": "Jasny, wyrazisty i pełen pozytywnej energii.",
        "gender": "female",
        "recommended": False,
    },
    {
        "id": "Fenrir",
        "name": "Fenrir",
        "style": "Excitable",
        "description": "Ekscytujący, pełen zapału do wielkich inwestycji.",
        "gender": "male",
        "recommended": False,
    },
    {
        "id": "Achird",
        "name": "Achird",
        "style": "Friendly",
        "description": "Serdeczny, wspierający i cierpliwy przewodnik.",
        "gender": "male",
        "recommended": False,
    },
    {
        "id": "Sadaltager",
        "name": "Sadaltager",
        "style": "Knowledgeable",
        "description": "Doświadczony profesor rynków kapitałowych.",
        "gender": "male",
        "recommended": False,
    },
]


ROBERT_BIZNESU_SYSTEM_INSTRUCTION = """Jesteś Robertem Biznesu — charyzmatycznym, bystrym i wspierającym rekinem finansów, oficjalną maskotką i mentorem platformy edukacyjnej Rekiny Roberta (Commerzbank Collabothon 2026 - Finance Quest).

TWOJA MISJA:
- Przełamywać barierę strachu przed finansami i inwestowaniem.
- Tłumaczyć trudne pojęcia (akcje, obligacje, inflacja, procent składany, ETF-y, GPW, dywersyfikacja) w sposób prosty, żywy i angażujący dla każdego pokolenia.
- Prowadzić dialog w stylu rekina biznesu: przyjazny, odważny, z lekkim morskim/rekinim humorem (np. "pływamy po bezpiecznych wodach finansowych", "rekiny nie boją się wiedzy!"), ale zawsze merytoryczny i rzetelny.
- Korzystaj z załączonego kontekstu z Bazy Wiedzy i Lekcji platformy, aby precyzyjnie odpowiadać na pytania użytkownika.
- Wskazuj powiązane lekcje i moduły na platformie, jeśli są dostępne w kontekście.
- Odpowiedzi formułuj zwięźle, przejrzyście (wypunktowania, pogrubienia kluczowych terminów).
- Na koniec dodaj krótkie przypomnienie edukacyjne, że prezentowane informacje mają charakter edukacyjny i nie stanowią formalnej rekomendacji inwestycyjnej.
"""


def generate_synthetic_wav(duration_seconds: float = 0.5, freq: float = 440.0) -> bytes:
    """Generates a valid lightweight PCM WAV tone for mock/demo mode when API key is unset or offline."""
    sample_rate = 24000
    num_samples = int(sample_rate * duration_seconds)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_samples):
            t = float(i) / sample_rate
            fade = math.sin(math.pi * i / num_samples)
            sample_val = int(fade * 16000 * math.sin(2 * math.pi * freq * t))
            frames.extend(struct.pack("<h", sample_val))
        wav_file.writeframes(frames)
    return buffer.getvalue()


class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self._client: Optional[genai.Client] = None
        if self.api_key:
            try:
                # Use v1beta for speech generation, voices, and fast interactions
                self._client = genai.Client(
                    api_key=self.api_key,
                    http_options={"api_version": "v1beta"},
                )
            except Exception as e:
                print(f"[GeminiService] Error initializing genai.Client: {e}")
                self._client = None

    @property
    def is_available(self) -> bool:
        return bool(self.api_key and self._client)

    def get_voices(self) -> List[Dict[str, Any]]:
        return PREBUILT_VOICES

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generates embedding using gemini-embedding-2."""
        if not self.is_available:
            return None
        try:
            result = self._client.models.embed_content(
                model="gemini-embedding-2",
                contents=text,
            )
            if hasattr(result, "embeddings") and result.embeddings:
                return list(result.embeddings[0].values)
            if hasattr(result, "embedding") and result.embedding:
                return list(result.embedding.values)
        except Exception as e:
            print(f"[GeminiService] Error generating embedding with gemini-embedding-2: {e}")
        return None

    def generate_chat_response(
        self,
        user_message: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates grounded financial response using Gemini with RAG context.
        """
        context_blocks = []
        for i, chunk in enumerate(context_chunks, 1):
            source_title = chunk.get("title", f"Fragment {i}")
            category = chunk.get("category", "finanse")
            content = chunk.get("content", "")
            context_blocks.append(f"### [Źródło {i}: {source_title} ({category})]\n{content}")
        
        context_text = "\n\n".join(context_blocks) if context_blocks else "Brak bezpośrednich materiałów źródłowych."

        prompt_input = f"""KONTEKST BAZY WIEDZY I LEKCJI PLATFORMY:
{context_text}

DANE UCZNIA:
Imię: {user_name or 'Uczeń'}

PYTANIE UCZNIA:
{user_message}
"""

        if self.is_available:
            # We prefer gemini-3.5-flash-lite for instant, high-throughput responses on Free/Standard tiers
            candidate_models = ["gemini-3.5-flash-lite", "gemini-4-hydrogen", "gemini-3.8-flash"]
            for model_name in candidate_models:
                try:
                    interaction = self._client.interactions.create(
                        model=model_name,
                        input=prompt_input,
                        system_instruction=ROBERT_BIZNESU_SYSTEM_INSTRUCTION,
                    )
                    output_text = interaction.output_text
                    if output_text:
                        return {
                            "reply": output_text,
                            "model": model_name,
                            "sources": [
                                {
                                    "id": c.get("id"),
                                    "title": c.get("title"),
                                    "category": c.get("category"),
                                    "score": c.get("score"),
                                    "related_course_slug": c.get("related_course_slug"),
                                }
                                for c in context_chunks
                            ],
                        }
                except Exception as e:
                    print(f"[GeminiService] Model {model_name} error: {e}")

        # Graceful fallback response when offline or models unavailable
        mock_reply = self._generate_fallback_response(user_message, context_chunks, user_name)
        return {
            "reply": mock_reply,
            "model": "gemini (tryb awaryjny)",
            "sources": [
                {
                    "id": c.get("id"),
                    "title": c.get("title"),
                    "category": c.get("category"),
                    "score": c.get("score"),
                    "related_course_slug": c.get("related_course_slug"),
                }
                for c in context_chunks
            ],
        }

    def generate_speech(self, text: str, voice: str = "Puck") -> Tuple[bytes, str]:
        """
        Synthesizes speech using gemini-3.8-flash-lite-tts or gemini-3.8-flash-tts.
        Returns (audio_bytes, mime_type).
        """
        valid_voice_names = {v["id"] for v in PREBUILT_VOICES}
        selected_voice = voice if voice in valid_voice_names else "Puck"

        if self.is_available:
            # Clean text of markdown and keep key sentences for speech synthesis
            clean_text = text.replace("**", "").replace("#", "").replace("*", "")
            sentences = [s.strip() for s in clean_text.split(".") if s.strip()]
            spoken_text = ". ".join(sentences[:4]) + "." if sentences else clean_text[:400]
            if len(spoken_text) > 400:
                spoken_text = spoken_text[:400]

            for tts_model in ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"]:
                try:
                    interaction = self._client.interactions.create(
                        model=tts_model,
                        input=[{
                            "type": "user_input",
                            "content": [{
                                "type": "text",
                                "text": spoken_text,
                                "annotations": [{
                                    "type": "speech_metadata",
                                    "style": "cheerful and friendly",
                                }],
                            }],
                        }],
                        response_format={"type": "audio"},
                        generation_config={
                            "speech_config": [
                                {"voice": selected_voice},
                            ]
                        },
                    )
                    if interaction.output_audio and interaction.output_audio.data:
                        audio_bytes = base64.b64decode(interaction.output_audio.data)
                        mime_type = interaction.output_audio.mime_type or "audio/wav"
                        return audio_bytes, mime_type
                except Exception as e:
                    print(f"[GeminiService] TTS model {tts_model} error: {e}")

        # Return synthetic audio for demonstration if offline or TTS error
        wav_bytes = generate_synthetic_wav(duration_seconds=0.8, freq=520.0)
        return wav_bytes, "audio/wav"

    def _generate_fallback_response(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        user_name: Optional[str],
    ) -> str:
        name = user_name or "młody Rekinie"
        q_lower = query.lower()

        if context_chunks:
            top = context_chunks[0]
            summary = top.get("content", "")[:350] + "..."
            return (
                f"Cześć, {name}! Tu Robert Biznesu. 🦈\n\n"
                f"Znakomite pytanie! W naszych materiałach edukacyjnych dotyczących **{top.get('title')}** "
                f"znajdziesz kluczową odpowiedź:\n\n"
                f"> {summary}\n\n"
                f"Pamiętaj: na rynku wygrywają ci, którzy zachowują zimną krew i regularnie inwestują w wiedzę. "
                f"Zajrzyj do naszych lekcji, aby zgłębić ten temat krok po kroku!\n\n"
                f"*(Uwaga: Treści edukacyjne platformy Rekiny Roberta nie stanowią oficjalnej porady inwestycyjnej.)*"
            )

        if "akcj" in q_lower or "obligacj" in q_lower:
            return (
                f"Cześć, {name}! Akcje to udział w firmie — kiedy spółka rośnie, rośnie Twój zysk i możesz dostać dywidendę. "
                f"Obligacje to z kolei bezpieczniejsza pożyczka dla państwa lub korporacji ze stałym procentem. "
                f"Prawdziwy rekin biznesu łączy oba te instrumenty dla bezpieczeństwa i wzrostu!"
            )

        return (
            f"Witaj na pokładzie, {name}! Tu Robert Biznesu. 🦈\n"
            f"Chętnie pomogę Ci zrozumieć finanse: od budżetu domowego i poduszki bezpieczeństwa, "
            f"przez procent składany, po inwestowanie na giełdzie i ETF-y. "
            f"O co dokładnie chciałbyś zapytać?"
        )
