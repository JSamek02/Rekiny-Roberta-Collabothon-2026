#!/usr/bin/env python3
"""
Testowanie chatbota Robert Biznesu AI (RAG + Gemini API + Voice TTS) bezpośrednio w terminalu.
Użycie:
    python tests/test_chat_live.py
    python tests/test_chat_live.py "Jak działa procent składany?"
    python tests/test_chat_live.py --voice Charon "Czym jest poduszka finansowa?"
    python tests/test_chat_live.py --interactive
"""

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Załaduj konfigurację z backend/.env
test_dir = Path(__file__).resolve().parent
backend_dir = test_dir.parent
load_dotenv(backend_dir / ".env")
sys.path.insert(0, str(backend_dir))

from services.gemini_service import GeminiService, PREBUILT_VOICES
from services.rag_service import RagService


def run_query(query: str, voice: str = "Puck", save_audio: bool = True):
    print("=" * 70)
    print(f"🦈 PYTANIE DO ROBERTA BIZNESU: {query}")
    print(f"🎙️  WYBRANY GŁOS: {voice}")
    print("=" * 70)

    gemini_svc = GeminiService()
    if not gemini_svc.is_available:
        print("[OSTRZEŻENIE] Brak klucza GEMINI_API_KEY w .env lub brak połączenia. Działa tryb demonstracyjny.")
    else:
        print("✓ Połączono z Google Gemini API")

    rag = RagService(gemini_svc)

    print("\n[1/3] 🔍 Przeszukiwanie Bazy Wiedzy RAG (Retrieval-Augmented Generation)...")
    sources = rag.retrieve(query, top_k=3)
    if sources:
        for idx, s in enumerate(sources, 1):
            score_str = f"dopasowanie: {s.get('score', 0):.2f}"
            print(f"   [{idx}] {s.get('title')} ({s.get('category')}) — {score_str}")
    else:
        print("   Brak bezpośrednich źródeł.")

    print("\n[2/3] 🤖 Generowanie odpowiedzi Roberta Biznesu (Gemini)...")
    chat_res = gemini_svc.generate_chat_response(
        user_message=query,
        context_chunks=sources,
        user_name="Uczeń",
    )

    model_used = chat_res.get("model", "nieznany")
    reply_text = chat_res.get("reply", "")

    print(f"   Model: {model_used}\n")
    print("-" * 70)
    print(reply_text)
    print("-" * 70)

    if save_audio:
        print(f"\n[3/3] 🔊 Synteza mowy głosem '{voice}' (Gemini 3.8 Flash Lite TTS)...")
        audio_bytes, mime = gemini_svc.generate_speech(reply_text, voice=voice)
        out_filename = "odpowiedz_roberta.wav"
        out_path = backend_dir / out_filename
        with open(out_path, "wb") as f:
            f.write(audio_bytes)
        print(f"   ✓ Zapisano plik audio: {out_filename} ({len(audio_bytes):,} bajtów, format: {mime})")

    print("\n✓ Test zakończony pomyślnie!\n")


def interactive_mode(voice: str = "Puck"):
    print("=" * 70)
    print("🦈 TRYB INTERAKTYWNY W TERMINALU: Czat z Robertem Biznesu")
    print(f"🎙️  Domyślny głos TTS: {voice}")
    print("Wpisz pytanie i naciśnij Enter. Wpisz 'exit' lub 'q', aby zakończyć.")
    print("=" * 70)

    while True:
        try:
            query = input("\nTwoje pytanie > ").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                print("Do zobaczenia na giełdzie! 🦈")
                break
            run_query(query, voice=voice, save_audio=True)
        except (KeyboardInterrupt, EOFError):
            print("\nDo zobaczenia!")
            break


def main():
    parser = argparse.ArgumentParser(description="Test chatbota finansowego Robert Biznesu AI w terminalu")
    parser.add_argument("query", nargs="?", default="Czym różni się akcja od obligacji i jak działa procent składany?")
    parser.add_argument("--voice", "-v", default="Puck", choices=[v["id"] for v in PREBUILT_VOICES], help="Wybór głosu Gemini TTS")
    parser.add_argument("--interactive", "-i", action="store_true", help="Uruchom tryb interaktywnego dialogu w terminalu")
    parser.add_argument("--no-audio", action="store_true", help="Nie generuj pliku audio WAV")

    args = parser.parse_args()

    if args.interactive:
        interactive_mode(voice=args.voice)
    else:
        run_query(args.query, voice=args.voice, save_audio=not args.no_audio)


if __name__ == "__main__":
    main()
