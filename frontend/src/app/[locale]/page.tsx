import { RobertChatbot } from '@/components/chat/RobertChatbot';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-cyan-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦈</span>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Rekiny Roberta
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                Finance Quest
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <span className="hidden sm:inline-block text-xs bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full font-semibold">
              🪙 50 SharCoins
            </span>
            <span className="hidden sm:inline-block text-xs bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300 px-3 py-1 rounded-full font-semibold">
              ⭐ Poziom 1: Młody Rekin
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/80 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 text-xs font-semibold">
            <span>✨ Nowość: Gemini API 4 + 3.8 TTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ucz się finansów z{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Robertem Biznesu
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Zadawaj pytania, korzystaj z bazy wiedzy opartej o RAG (Retrieval-Augmented Generation) i
            rozmawiaj głosowo dzięki modelom mowy Google Gemini TTS!
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 shadow-sm flex items-start gap-3">
            <span className="text-2xl p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/80">🧠</span>
            <div>
              <h3 className="font-semibold text-sm">Grounded RAG Knowledge</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Odpowiedzi oparte o bazę wiedzy: poduszka finansowa, 50/30/20, akcje, obligacje, ETF i lekcje platformy.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 shadow-sm flex items-start gap-3">
            <span className="text-2xl p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80">🎙️</span>
            <div>
              <h3 className="font-semibold text-sm">Czat głosowy Gemini 3.8 TTS</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Wybierz swój ulubiony głos (Puck, Charon, Kore, Aoede, Zephyr) i słuchaj porad finansowych.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 shadow-sm flex items-start gap-3">
            <span className="text-2xl p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80">🚀</span>
            <div>
              <h3 className="font-semibold text-sm">Gamifikacja & Rekomendacje</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Bezpośrednie odsyłacze do odpowiednich lekcji i quizów w aplikacji na podstawie pytań.
              </p>
            </div>
          </div>
        </div>

        {/* Chatbot Interactive Widget */}
        <section className="w-full">
          <RobertChatbot />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>Rekiny Roberta — Collabothon 2026 (Commerzbank Finance Quest). Zasilane przez Google Gemini API.</p>
      </footer>
    </div>
  );
}
