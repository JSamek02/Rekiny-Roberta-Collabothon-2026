import json
import math
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.models import Course, Lesson, Activity
from services.gemini_service import GeminiService


CACHE_FILE = Path(__file__).resolve().parent / ".embedding_cache.json"


# Core Curated Finance Knowledge Base (Rekiny Roberta / Commerzbank Finance Quest)
CURATED_FINANCE_DOCUMENTS = [
    {
        "id": "kb-poduszka-finansowa",
        "title": "Poduszka finansowa i bezpieczeństwo awaryjne",
        "category": "budgeting",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["poduszka finansowa", "oszczędności", "awaryjny", "bezpieczeństwo", "wydatki", "płynność"],
        "content": (
            "Poduszka finansowa (fundusz awaryjny) to żelazna rezerwa pieniężna, która zabezpiecza nas na wypadek "
            "nagłych zdarzeń: utraty pracy, awarii samochodu czy nagłych wydatków zdrowotnych. "
            "Prawidłowa poduszka finansowa powinna wynosić od 3 do 6 miesięcy Twoich niezbędnych wydatków do życia. "
            "Środki te muszą być natychmiast płynne i całkowicie bezpieczne: trzymaj je na koncie oszczędnościowym "
            "lub w krótkoterminowych obligacjach skarbowych (np. indeksowanych inflacją). "
            "NIGDY nie inwestuj poduszki finansowej na giełdzie ani w aktywa o wysokim ryzyku! "
            "Dopiero po zbudowaniu stabilnej poduszki finansowej młody rekin biznesu powinien rozpoczynać przygodę z rynkiem akcji."
        ),
    },
    {
        "id": "kb-regula-50-30-20",
        "title": "Reguła budżetowa 50/30/20",
        "category": "budgeting",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["budżet", "50/30/20", "wydatki", "oszczędzanie", "potrzeby", "zarządzanie pieniędzmi"],
        "content": (
            "Reguła 50/30/20 to intuicyjna metoda podziału comiesięcznego dochodu netto na trzy kategorie: "
            "1. 50% - Potrzeby niezbędne (Needs): mieszkanie, czynsz, media, jedzenie, transport, spłata podstawowych rachunków. "
            "2. 30% - Zachcianki i styl życia (Wants): wyjścia do restauracji, hobby, wakacje, subskrypcje, rozrywka. "
            "3. 20% - Oszczędności i inwestycje (Savings & Investments): budowanie poduszki finansowej, wpłaty na IKE/IKZE, "
            "inwestowanie w ETF-y lub nadpłata długów konsumpcyjnych. "
            "Reguła ta daje równowagę między cieszeniem się życiem dzisiaj a budowaniem bezpieczeństwa na jutro."
        ),
    },
    {
        "id": "kb-akcje-vs-obligacje",
        "title": "Akcje vs Obligacje: Udział w firmie kontra pożyczka",
        "category": "investing",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["akcje", "obligacje", "gpw", "giełda", "dywidenda", "kupon", "ryzyko"],
        "content": (
            "Kupując AKCJĘ, stajesz się współwłaścicielem spółki (akcjonariuszem). Zyskujesz na wzroście wartości rynkowej akcji "
            "oraz możesz otrzymywać dywidendę (część wypracowanego przez spółkę zysku). Akcje wiążą się z większą zmiennością "
            "i ryzykiem, ale historycznie dają najwyższą stopę zwrotu w długim horyzoncie (np. powyżej 5-10 lat). "
            "Kupując OBLIGACJĘ (np. Skarbu Państwa lub korporacyjną), pożyczasz emitentowi kapitał w zamian za regularne odsetki "
            "(kupon) oraz zwrot pełnej kwoty po terminie zapadalności. Obligacje skarbowe są fundamentem bezpieczeństwa i stabilizują portfel. "
            "Portfel inwestora najczęściej łączy akcje (silnik wzrostu) oraz obligacje (poduszka amortyzująca spadki)."
        ),
    },
    {
        "id": "kb-etf-inwestowanie-pasywne",
        "title": "ETF-y i Inwestowanie Pasywne",
        "category": "investing",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["etf", "indeks", "inwestowanie pasywne", "dywersyfikacja", "s&p 500", "msci world", "wig20"],
        "content": (
            "ETF (Exchange Traded Fund) to fundusz notowany na giełdzie, którego celem jest wierne naśladowanie danego indeksu "
            "(np. S&P 500, MSCI World, DAX czy WIG20). "
            "Zamiast kupować akcje jednej spółki i ryzykować jej bankructwo, za pośrednictwem jednego ETF-a kupujesz ułamek setek "
            "lub tysięcy największych światowych firm. "
            "Główne zalety ETF: natychmiastowa globalna dywersyfikacja, bardzo niskie koszty roczne (TER często poniżej 0.2%), "
            "wysoka płynność i prostota. To rekomendowane narzędzie dla inwestorów długoterminowych."
        ),
    },
    {
        "id": "kb-procent-skladany",
        "title": "Procent składany i potęga czasu",
        "category": "investing",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["procent składany", "czas", "kapitalizacja", "zyski", "wzrost", "emerytura"],
        "content": (
            "Procent składany (zwany przez Einsteina ósmym cudem świata) polega na tym, że wypracowane odsetki i zyski są reinwestowane, "
            "dzięki czemu w kolejnych okresach zarabiają one kolejne odsetki. Tworzy to efekt kuli śnieżnej! "
            "Przykład: Inwestując regularnie 300 zł miesięcznie przy średniej stopie zwrotu 7% rocznie, po 10 latach zgromadzisz ok. 52 tys. zł, "
            "ale po 30 latach będzie to już ponad 360 tys. zł, z czego wpłacony kapitał to tylko 108 tys. zł, a reszta to zyski! "
            "Kluczowy wniosek: Czas spędzony na rynku ma większe znaczenie niż próby idealnego wyczucia momentu zakupu (timing the market)."
        ),
    },
    {
        "id": "kb-inflacja-ochrona-kapitalu",
        "title": "Inflacja i ochrona siły nabywczej pieniądza",
        "category": "economics",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["inflacja", "siła nabywcza", "spadek wartości", "nbp", "stopy procentowe", "gotówka"],
        "content": (
            "Inflacja to proces wzrostu przeciętnego poziomu cen w gospodarce, oznaczający spadek siły nabywczej pieniądza. "
            "Jeżeli inflacja wynosi 6% rocznie, to za 100 zł za rok kupisz tyle, ile dziś za ok. 94 zł. "
            "Trzymanie wszystkich oszczędności w gotówce lub na nieoprocentowanym koncie gwarantuje ich realną stratę. "
            "Aby chronić kapitał, warto wybierać instrumenty chroniące przed inflacją: 4- i 10-letnie polskie obligacje skarbowe "
            "indeksowane inflacją (COI, EDO), nieruchomości czy szeroki rynek akcji (spółki mogą podnosić ceny swoich produktów)."
        ),
    },
    {
        "id": "kb-ike-ikze-podatki",
        "title": "IKE i IKZE: Oszczędzanie i inwestowanie bez podatku Belki",
        "category": "investing",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["ike", "ikze", "podatek belki", "emerytura", "ulga pit", "zwolnienie podatkowe"],
        "content": (
            "W Polsce zyski z inwestycji kapitałowych obłożone są 19% podatkiem Belki. "
            "IKE (Indywidualne Konto Emerytalne) oraz IKZE (Indywidualne Konto Zabezpieczenia Emerytalnego) to rządowe opakowania "
            "inwestycyjne, które pozwalają inwestować legalnie bez płacenia tego podatku! "
            "- IKE: Zyski są w 100% zwolnione z podatku Belki przy wypłacie po ukończeniu 60. roku życia. "
            "- IKZE: Każda wpłacona w danym roku kwota (do określonego limitu) odliczana jest od podstawy opodatkowania w rocznym PIT, "
            "co daje natychmiastowy zwrot podatku (np. 12% lub 32% od wpłaconej kwoty!). "
            "Dla młodego inwestora otwarcie konta maklerskiego IKE/IKZE to pierwszy logiczny krok na giełdzie."
        ),
    },
    {
        "id": "kb-zarzadzanie-ryzykiem",
        "title": "Zarządzanie ryzykiem i dywersyfikacja portfela",
        "category": "investing",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["ryzyko", "dywersyfikacja", "portfel", "horyzont", "strata", "zmienność"],
        "content": (
            "Złota zasada każdego rekina biznesu brzmi: 'Nigdy nie wkładaj wszystkich jajek do jednego koszyka'. "
            "Dywersyfikacja oznacza rozłożenie kapitału na różne klasy aktywów (akcje, obligacje, złoto, gotówka), "
            "różne sektory gospodarki (technologia, finanse, medycyna) oraz różne regiony geograficzne (Polska, USA, rynki wschodzące). "
            "Dzięki dywersyfikacji spadek wartości jednej firmy lub sektora nie niszczy całego Twojego majątku. "
            "Dopasuj ryzyko do swojego wieku i horyzontu: im bliżej celu (np. emerytury lub zakupu mieszkania), tym bezpieczniejszy "
            "powinien być Twój portfel."
        ),
    },
    {
        "id": "kb-psychologia-fomo-dca",
        "title": "Psychologia inwestora: Emocje, FOMO i strategia DCA",
        "category": "psychology",
        "related_course_slug": "podstawy-gieldy",
        "keywords": ["psychologia", "fomo", "panika", "dca", "emocje", "długoterminowość"],
        "content": (
            "Największym wrogiem inwestora nie są rynki, lecz jego własne emocje: chciwość (gdy ceny rosną i czujemy FOMO — strach przed "
            "ominięciem okazji) oraz strach (gdy rynki spadają i w panice sprzedajemy aktywa na samym dnie). "
            "Najlepszym lekiem na emocje jest strategia DCA (Dollar-Cost Averaging): regularne dokupywanie aktywów za stałą kwotę co miesiąc, "
            "niezależnie od tego, czy na giełdzie świeci słońce, czy panuje bessa. "
            "Dzięki temu automatycznie kupujesz więcej, gdy jest tanio, i mniej, gdy jest drogo, uśredniając cenę zakupu."
        ),
    },
]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class RagService:
    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self.gemini = gemini_service or GeminiService()
        self._curated_docs = list(CURATED_FINANCE_DOCUMENTS)
        self._embedded_docs: Dict[str, List[float]] = {}
        self._load_cache()

    def _load_cache(self):
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self._embedded_docs = json.load(f)
            except Exception as e:
                print(f"[RagService] Warning loading cache: {e}")
                self._embedded_docs = {}

    def _save_cache(self):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._embedded_docs, f)
        except Exception as e:
            print(f"[RagService] Warning saving cache: {e}")

    def _tokenize(self, text: str) -> set[str]:
        words = re.findall(r"\w+", text.lower())
        return {w for w in words if len(w) > 2}

    def _lexical_score(self, query: str, doc_text: str, keywords: Optional[List[str]] = None) -> float:
        q_tokens = self._tokenize(query)
        if not q_tokens:
            return 0.0
        doc_tokens = self._tokenize(doc_text)
        kw_tokens = set()
        if keywords:
            for kw in keywords:
                kw_tokens.update(self._tokenize(kw))

        matches = q_tokens.intersection(doc_tokens)
        kw_matches = q_tokens.intersection(kw_tokens)
        score = len(matches) / float(len(q_tokens))
        if kw_matches:
            score += 0.5 * (len(kw_matches) / float(len(q_tokens)))
        return min(1.0, score)

    def _get_database_documents(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Dynamically loads lessons and activities from PostgreSQL/SQLite database into searchable chunks."""
        docs: List[Dict[str, Any]] = []
        if db is None:
            return docs

        try:
            courses = db.scalars(select(Course).where(Course.is_published.is_(True))).all()
            for c in courses:
                for lesson in c.lessons:
                    if not lesson.is_published:
                        continue
                    # Collect article text from activities
                    activities_text = []
                    for act in lesson.activities:
                        if act.activity_type == "article" and act.content:
                            md = act.content.get("markdown", "")
                            if md:
                                activities_text.append(f"Artykuł: {act.title}\n{md}")
                        elif act.activity_type == "quiz" and act.content:
                            questions = act.content.get("questions", [])
                            q_prompts = [q.get("prompt", "") for q in questions if q.get("prompt")]
                            if q_prompts:
                                activities_text.append("Pytania quizowe: " + "; ".join(q_prompts))

                    combined_content = (
                        f"Kurs: {c.title} (kategoria: {c.category}, poziom: {c.difficulty}).\n"
                        f"Lekcja: {lesson.title}. {lesson.description or ''}\n"
                        + "\n".join(activities_text)
                    )

                    docs.append({
                        "id": f"db-course-{c.id}-lesson-{lesson.id}",
                        "title": f"{c.title} — {lesson.title}",
                        "category": c.category,
                        "related_course_slug": c.slug,
                        "keywords": [c.title, lesson.title, c.category, c.difficulty],
                        "content": combined_content,
                    })
        except Exception as e:
            print(f"[RagService] Error loading course documents from database: {e}")

        return docs

    def retrieve(
        self,
        query: str,
        db: Optional[Session] = None,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant finance knowledge chunks using semantic embeddings and keyword matching.
        """
        all_docs = list(self._curated_docs)
        if db is not None:
            db_docs = self._get_database_documents(db)
            all_docs.extend(db_docs)

        query_embedding = None
        if self.gemini.is_available:
            query_embedding = self.gemini.generate_embedding(query)

        scored_docs: List[Tuple[float, Dict[str, Any]]] = []

        for doc in all_docs:
            doc_id = doc["id"]
            content = doc.get("content", "")
            title = doc.get("title", "")
            keywords = doc.get("keywords", [])

            # Compute lexical score
            lex_score = self._lexical_score(query, f"{title} {content}", keywords)

            final_score = lex_score

            # Compute semantic vector similarity if embeddings available
            if query_embedding:
                doc_vec = self._embedded_docs.get(doc_id)
                if not doc_vec:
                    doc_vec = self.gemini.generate_embedding(f"{title}: {content}")
                    if doc_vec:
                        self._embedded_docs[doc_id] = doc_vec
                        self._save_cache()
                
                if doc_vec:
                    sem_score = cosine_similarity(query_embedding, doc_vec)
                    # Blend semantic (70%) and lexical (30%)
                    final_score = 0.7 * sem_score + 0.3 * lex_score

            scored_docs.append((final_score, doc))

        # Sort descending by score
        scored_docs.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, doc in scored_docs[:top_k]:
            doc_copy = dict(doc)
            doc_copy["score"] = round(float(score), 4)
            results.append(doc_copy)

        return results
