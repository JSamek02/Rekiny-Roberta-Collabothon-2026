-- Dane demonstracyjne do kursów, lekcji, aktywności i postępu.
-- Skrypt jest idempotentny: można go uruchamiać wielokrotnie bez duplikowania danych.
-- Nie zawiera binarnego MP4. Wideo dodaj przez POST /api/activities/:id/video.

BEGIN;

INSERT INTO courses (
    slug, title, description, category, difficulty, estimated_minutes,
    icon_url, is_published, translations
)
VALUES
(
    'podstawy-gieldy',
    'Podstawy giełdy',
    'Poznaj akcje, obligacje i podstawy budowania portfela.',
    'investing', 'beginner', 35, NULL, TRUE,
    $${"en":{"title":"Stock market basics","description":"Learn about shares, bonds and building a first portfolio."},"de":{"title":"Grundlagen der Börse","description":"Lerne Aktien, Anleihen und den Aufbau eines ersten Portfolios kennen."}}$$::jsonb
),
(
    'etf-w-praktyce',
    'ETF w praktyce',
    'Dowiedz się, czym jest ETF i jak pomaga w dywersyfikacji.',
    'investing', 'beginner', 20, NULL, TRUE,
    $${"en":{"title":"ETFs in practice","description":"Learn what an ETF is and how it supports diversification."},"de":{"title":"ETFs in der Praxis","description":"Lerne, was ein ETF ist und wie er bei der Diversifikation hilft."}}$$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Kursy zasilające istniejące ścieżki roadmapy frontendu.
INSERT INTO courses (
    slug, title, description, category, difficulty, estimated_minutes,
    icon_url, is_published, translations
)
VALUES
(
    'stocks-bonds-roadmap', 'Akcje i obligacje',
    'Poznaj podstawowe instrumenty rynku kapitałowego.',
    'stocks-bonds', 'beginner', 45, NULL, TRUE,
    $${"en":{"title":"Stocks and bonds","description":"Learn the essential instruments of the capital market."},"de":{"title":"Aktien und Anleihen","description":"Lerne die wichtigsten Instrumente des Kapitalmarkts kennen."}}$$::jsonb
),
(
    'investing-roadmap', 'Inwestowanie',
    'Zbuduj podstawy świadomego inwestowania krok po kroku.',
    'investing', 'beginner', 45, NULL, TRUE,
    $${"en":{"title":"Investing","description":"Build the foundations of informed investing step by step."},"de":{"title":"Investieren","description":"Baue Schritt für Schritt die Grundlagen bewussten Investierens auf."}}$$::jsonb
),
(
    'budgeting-roadmap', 'Budżetowanie',
    'Uporządkuj swoje finanse osobiste i planuj wydatki.',
    'budgeting', 'beginner', 45, NULL, TRUE,
    $${"en":{"title":"Budgeting","description":"Organise your personal finances and plan your expenses."},"de":{"title":"Budgetplanung","description":"Ordne deine persönlichen Finanzen und plane deine Ausgaben."}}$$::jsonb
),
(
    'economics-roadmap', 'Ekonomia',
    'Zrozum najważniejsze mechanizmy gospodarki.',
    'economics', 'beginner', 45, NULL, TRUE,
    $${"en":{"title":"Economics","description":"Understand the key mechanisms of the economy."},"de":{"title":"Wirtschaft","description":"Verstehe die wichtigsten Mechanismen der Wirtschaft."}}$$::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    c.id,
    'Akcje, obligacje i ryzyko',
    'Najważniejsze instrumenty finansowe dla początkujących.',
    1, TRUE, 30,
    $${"en":{"title":"Shares, bonds and risk","description":"The key financial instruments for beginners."},"de":{"title":"Aktien, Anleihen und Risiko","description":"Die wichtigsten Finanzinstrumente für Einsteiger."}}$$::jsonb
FROM courses c
WHERE c.slug = 'podstawy-gieldy'
  AND NOT EXISTS (
      SELECT 1 FROM lessons l WHERE l.course_id = c.id AND l.order_index = 1
  );

INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    c.id,
    'Pierwszy portfel',
    'Jak ograniczać ryzyko dzięki dywersyfikacji.',
    2, TRUE, 30,
    $${"en":{"title":"Your first portfolio","description":"How to reduce risk through diversification."},"de":{"title":"Dein erstes Portfolio","description":"Wie Diversifikation Risiken reduziert."}}$$::jsonb
FROM courses c
WHERE c.slug = 'podstawy-gieldy'
  AND NOT EXISTS (
      SELECT 1 FROM lessons l WHERE l.course_id = c.id AND l.order_index = 2
  );

INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    c.id,
    'Czym jest ETF?',
    'Fundusz notowany na giełdzie w prostych słowach.',
    1, TRUE, 25,
    $${"en":{"title":"What is an ETF?","description":"An exchange-traded fund in plain language."},"de":{"title":"Was ist ein ETF?","description":"Ein börsengehandelter Fonds einfach erklärt."}}$$::jsonb
FROM courses c
WHERE c.slug = 'etf-w-praktyce'
  AND NOT EXISTS (
      SELECT 1 FROM lessons l WHERE l.course_id = c.id AND l.order_index = 1
  );

WITH lesson_templates (order_index, title, description, title_en, description_en, title_de, description_de) AS (
    VALUES
        (1, 'Podstawy finansów', 'Poznaj język pieniędzy i najważniejsze pojęcia.', 'Financial foundations', 'Learn the language of money and the key concepts.', 'Finanzielle Grundlagen', 'Lerne die Sprache des Geldes und die wichtigsten Begriffe.'),
        (2, 'Zrozumienie ryzyka', 'Sprawdź, skąd bierze się ryzyko i jak nim zarządzać.', 'Understanding risk', 'See where risk comes from and how to manage it.', 'Risiko verstehen', 'Erfahre, woher Risiko kommt und wie du damit umgehst.'),
        (3, 'Rozwijanie wiedzy', 'Zbuduj nawyk podejmowania świadomych decyzji.', 'Growing your knowledge', 'Build a habit of making informed decisions.', 'Wissen erweitern', 'Entwickle die Gewohnheit, bewusste Entscheidungen zu treffen.'),
        (4, 'Budowanie strategii', 'Połącz wiedzę w prostą, praktyczną strategię.', 'Building a strategy', 'Turn knowledge into a simple practical strategy.', 'Eine Strategie entwickeln', 'Verbinde dein Wissen zu einer einfachen praktischen Strategie.'),
        (5, 'Ostatnie wyzwanie', 'Sprawdź swoją wiedzę w końcowych aktywnościach.', 'The final challenge', 'Test your knowledge in the final activities.', 'Die letzte Herausforderung', 'Teste dein Wissen in den abschließenden Aktivitäten.')
)
INSERT INTO lessons (
    course_id, title, description, order_index, is_published, xp_reward, translations
)
SELECT
    c.id,
    template.title,
    template.description,
    template.order_index,
    TRUE,
    30,
    jsonb_build_object(
        'en', jsonb_build_object('title', template.title_en, 'description', template.description_en),
        'de', jsonb_build_object('title', template.title_de, 'description', template.description_de)
    )
FROM courses c
CROSS JOIN lesson_templates template
WHERE c.slug IN ('stocks-bonds-roadmap', 'investing-roadmap', 'budgeting-roadmap', 'economics-roadmap')
  AND NOT EXISTS (
      SELECT 1 FROM lessons l WHERE l.course_id = c.id AND l.order_index = template.order_index
  );

WITH activity_templates (
    activity_type, order_index, title, title_en, title_de, xp_reward, coin_reward, estimated_minutes,
    content, content_en, content_de
) AS (
    VALUES
    (
        'article', 1, 'Przeczytaj: fundamenty finansów', 'Read: financial foundations', 'Lesen: finanzielle Grundlagen', 10, 5, 4,
        $${"markdown":"# Fundamenty finansów\n\nŚwiadome decyzje zaczynają się od zrozumienia celu, ryzyka i czasu. Każda inwestycja wymaga planu.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Robert Biznesu","caption":"Najpierw plan, potem decyzja."}}$$::jsonb,
        $${"markdown":"# Financial foundations\n\nInformed decisions start with understanding your goal, risk and time horizon. Every investment needs a plan.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Robert Biznesu","caption":"Plan first, then decide."}}$$::jsonb,
        $${"markdown":"# Finanzielle Grundlagen\n\nBewusste Entscheidungen beginnen mit dem Verständnis von Ziel, Risiko und Zeithorizont. Jede Investition braucht einen Plan.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Robert Biznesu","caption":"Erst planen, dann entscheiden."}}$$::jsonb
    ),
    (
        'quiz', 2, 'Quiz: świadome decyzje', 'Quiz: informed decisions', 'Quiz: bewusste Entscheidungen', 20, 10, 3,
        $${"passing_score_percentage":50,"questions":[{"id":"q1","prompt":"Od czego warto zacząć przed podjęciem decyzji finansowej?","image":{"url":"/img/green-gem.svg","alt":"Zielony klejnot"},"options":[{"id":"a","text":"Od określenia celu i ryzyka"},{"id":"b","text":"Od obietnicy szybkiego zysku"},{"id":"c","text":"Od kopiowania cudzej decyzji"}],"correct_option_id":"a","explanation":"Cel i akceptowany poziom ryzyka pomagają wybrać właściwe rozwiązanie."}]}$$::jsonb,
        $${"questions":[{"id":"q1","prompt":"What is a good first step before a financial decision?","options":[{"id":"a","text":"Define your goal and risk"},{"id":"b","text":"Follow a promise of quick profit"},{"id":"c","text":"Copy someone else's decision"}],"explanation":"Your goal and acceptable risk help you choose the right solution."}]}$$::jsonb,
        $${"questions":[{"id":"q1","prompt":"Was ist ein guter erster Schritt vor einer finanziellen Entscheidung?","options":[{"id":"a","text":"Ziel und Risiko festlegen"},{"id":"b","text":"Einem Versprechen schnellen Gewinns folgen"},{"id":"c","text":"Die Entscheidung anderer kopieren"}],"explanation":"Ziel und akzeptiertes Risiko helfen dir bei der richtigen Wahl."}]}$$::jsonb
    ),
    (
        'video', 3, 'Film: plan działania', 'Video: an action plan', 'Video: ein Aktionsplan', 15, 5, 3,
        $${"duration_seconds":120,"description":"Po wgraniu MP4 obejrzysz tu krótkie podsumowanie lekcji."}$$::jsonb,
        $${"duration_seconds":120,"description":"After uploading an MP4, you will watch a short lesson summary here."}$$::jsonb,
        $${"duration_seconds":120,"description":"Nach dem Upload eines MP4 siehst du hier eine kurze Zusammenfassung der Lektion."}$$::jsonb
    )
)
INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    template.title,
    template.activity_type,
    template.order_index,
    template.xp_reward,
    template.coin_reward,
    template.estimated_minutes,
    template.content,
    jsonb_build_object(
        'en', jsonb_build_object('title', template.title_en, 'content', template.content_en),
        'de', jsonb_build_object('title', template.title_de, 'content', template.content_de)
    )
FROM lessons l
JOIN courses c ON c.id = l.course_id
CROSS JOIN activity_templates template
WHERE c.slug IN ('stocks-bonds-roadmap', 'investing-roadmap', 'budgeting-roadmap', 'economics-roadmap')
  AND NOT EXISTS (
      SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = template.order_index
  );

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Czym jest akcja?', 'article', 1, 10, 5, 4,
    $${"markdown":"# Czym jest akcja?\n\nAkcja jest udziałem w spółce. Jej posiadacz może korzystać ze wzrostu wartości firmy, ale ponosi również ryzyko spadku ceny.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Rekin Robert Biznesu","caption":"Zanim kupisz akcję, poznaj ryzyko inwestowania."}}$$::jsonb,
    $${"en":{"title":"What is a share?","content":{"markdown":"# What is a share?\n\nA share represents part ownership in a company. Its holder can benefit from growth, but also bears the risk of a falling price.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Robert Biznesu the shark","caption":"Before you buy a share, understand investment risk."}}},"de":{"title":"Was ist eine Aktie?","content":{"markdown":"# Was ist eine Aktie?\n\nEine Aktie ist ein Anteil an einem Unternehmen. Aktionäre profitieren von Wachstum, tragen aber auch das Kursrisiko.","reading_time_minutes":4,"image":{"url":"/img/shark.png","alt":"Robert Biznesu, der Hai","caption":"Bevor du eine Aktie kaufst, verstehe das Anlagerisiko."}}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'podstawy-gieldy' AND l.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 1);

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Quiz: akcje i obligacje', 'quiz', 2, 20, 10, 5,
    $${"passing_score_percentage":50,"questions":[{"id":"q1","prompt":"Co daje posiadanie akcji?","image":{"url":"/img/green-gem.svg","alt":"Zielony klejnot"},"options":[{"id":"a","text":"Udział w kapitale spółki"},{"id":"b","text":"Gwarancję zysku"},{"id":"c","text":"Prawo do stałego oprocentowania"}],"correct_option_id":"a","explanation":"Akcja daje udział własnościowy w spółce."},{"id":"q2","prompt":"Co jest typową cechą obligacji?","options":[{"id":"a","text":"Zawsze rośnie na wartości"},{"id":"b","text":"Emitent zobowiązuje się do zwrotu długu"},{"id":"c","text":"Daje udział w kapitale spółki"}],"correct_option_id":"b","explanation":"Obligacja jest formą długu emitenta."}]}$$::jsonb,
    $${"en":{"title":"Quiz: shares and bonds","content":{"questions":[{"id":"q1","prompt":"What does owning a share mean?","options":[{"id":"a","text":"Ownership in a company"},{"id":"b","text":"A guaranteed profit"},{"id":"c","text":"A right to fixed interest"}],"explanation":"A share represents ownership in a company."},{"id":"q2","prompt":"What is a typical feature of a bond?","options":[{"id":"a","text":"It always gains value"},{"id":"b","text":"The issuer promises to repay debt"},{"id":"c","text":"It gives ownership in a company"}],"explanation":"A bond is the issuer's debt instrument."}]}},"de":{"title":"Quiz: Aktien und Anleihen","content":{"questions":[{"id":"q1","prompt":"Was bedeutet der Besitz einer Aktie?","options":[{"id":"a","text":"Anteil an einem Unternehmen"},{"id":"b","text":"Garantierter Gewinn"},{"id":"c","text":"Anspruch auf feste Zinsen"}],"explanation":"Eine Aktie steht für einen Unternehmensanteil."},{"id":"q2","prompt":"Was ist typisch für eine Anleihe?","options":[{"id":"a","text":"Sie steigt immer im Wert"},{"id":"b","text":"Der Emittent verspricht die Rückzahlung einer Schuld"},{"id":"c","text":"Sie gibt Eigentum am Unternehmen"}],"explanation":"Eine Anleihe ist ein Schuldtitel des Emittenten."}]}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'podstawy-gieldy' AND l.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 2);

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Wideo: jak działa giełda?', 'video', 3, 15, 5, 3,
    $${"duration_seconds":120,"description":"Po wgraniu MP4 film będzie dostępny pod tym samym endpointem aktywności."}$$::jsonb,
    $${"en":{"title":"Video: how does the stock market work?","content":{"duration_seconds":120,"description":"After uploading an MP4, the video is available through this activity endpoint."}},"de":{"title":"Video: Wie funktioniert die Börse?","content":{"duration_seconds":120,"description":"Nach dem Upload eines MP4 ist das Video über diesen Aktivitätsendpunkt verfügbar."}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'podstawy-gieldy' AND l.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 3);

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Dlaczego dywersyfikować?', 'article', 1, 10, 5, 4,
    $${"markdown":"# Dywersyfikacja\n\nRozłożenie kapitału pomiędzy różne aktywa zmniejsza wpływ pojedynczej złej decyzji na cały portfel.","reading_time_minutes":4}$$::jsonb,
    $${"en":{"title":"Why diversify?","content":{"markdown":"# Diversification\n\nSpreading capital across different assets reduces the impact of a single bad decision on the whole portfolio.","reading_time_minutes":4}},"de":{"title":"Warum diversifizieren?","content":{"markdown":"# Diversifikation\n\nDie Verteilung des Kapitals auf verschiedene Anlagen verringert den Einfluss einer einzelnen schlechten Entscheidung auf das gesamte Portfolio.","reading_time_minutes":4}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'podstawy-gieldy' AND l.order_index = 2
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 1);

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Quiz: dywersyfikacja', 'quiz', 2, 20, 10, 4,
    $${"passing_score_percentage":100,"questions":[{"id":"q1","prompt":"Po co inwestor dywersyfikuje portfel?","options":[{"id":"a","text":"Żeby ograniczyć ryzyko pojedynczej inwestycji"},{"id":"b","text":"Żeby zagwarantować zysk"}],"correct_option_id":"a","explanation":"Dywersyfikacja ogranicza koncentrację ryzyka, ale nie gwarantuje zysku."}]}$$::jsonb,
    $${"en":{"title":"Quiz: diversification","content":{"questions":[{"id":"q1","prompt":"Why does an investor diversify a portfolio?","options":[{"id":"a","text":"To limit the risk of a single investment"},{"id":"b","text":"To guarantee a profit"}],"explanation":"Diversification reduces concentration risk, but does not guarantee profit."}]}},"de":{"title":"Quiz: Diversifikation","content":{"questions":[{"id":"q1","prompt":"Warum diversifiziert ein Anleger sein Portfolio?","options":[{"id":"a","text":"Um das Risiko einer einzelnen Anlage zu begrenzen"},{"id":"b","text":"Um Gewinn zu garantieren"}],"explanation":"Diversifikation verringert Klumpenrisiken, garantiert aber keinen Gewinn."}]}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'podstawy-gieldy' AND l.order_index = 2
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 2);

INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    l.id,
    'Wprowadzenie do ETF', 'article', 1, 10, 5, 4,
    $${"markdown":"# ETF\n\nETF to fundusz notowany na giełdzie. Jednym zakupem można uzyskać ekspozycję na wiele spółek albo obligacji.","reading_time_minutes":4}$$::jsonb,
    $${"en":{"title":"Introduction to ETFs","content":{"markdown":"# ETF\n\nAn ETF is a fund traded on an exchange. One purchase can provide exposure to many shares or bonds.","reading_time_minutes":4}},"de":{"title":"Einführung in ETFs","content":{"markdown":"# ETF\n\nEin ETF ist ein börsengehandelter Fonds. Mit einem Kauf erhältst du Zugang zu vielen Aktien oder Anleihen.","reading_time_minutes":4}}}$$::jsonb
FROM lessons l JOIN courses c ON c.id = l.course_id
WHERE c.slug = 'etf-w-praktyce' AND l.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.lesson_id = l.id AND a.order_index = 1);

INSERT INTO users (
    google_sub, email, name, picture, preferred_language, shark_coins, experience_points
)
VALUES (
    'mock:demo', 'demo@example.invalid', 'Demo użytkownik', NULL, 'pl', 3015, 30
)
ON CONFLICT (google_sub) DO NOTHING;

INSERT INTO user_course_enrollments (user_id, course_id)
SELECT u.id, c.id
FROM users u CROSS JOIN courses c
WHERE u.google_sub = 'mock:demo' AND c.slug = 'podstawy-gieldy'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO user_activity_progress (
    user_id, activity_id, status, quiz_score, passed, attempts_count,
    submitted_data, xp_earned, coins_earned, completed_at
)
SELECT
    u.id, a.id, 'completed', NULL, TRUE, 1,
    NULL, a.xp_reward, a.coin_reward, now()
FROM users u
JOIN courses c ON c.slug = 'podstawy-gieldy'
JOIN lessons l ON l.course_id = c.id AND l.order_index = 1
JOIN activities a ON a.lesson_id = l.id AND a.order_index = 1
WHERE u.google_sub = 'mock:demo'
ON CONFLICT (user_id, activity_id) DO NOTHING;

INSERT INTO user_activity_progress (
    user_id, activity_id, status, quiz_score, passed, attempts_count,
    submitted_data, xp_earned, coins_earned, completed_at
)
SELECT
    u.id, a.id, 'completed', 100, TRUE, 1,
    $${"q1":"a","q2":"b"}$$::jsonb, a.xp_reward, a.coin_reward, now()
FROM users u
JOIN courses c ON c.slug = 'podstawy-gieldy'
JOIN lessons l ON l.course_id = c.id AND l.order_index = 1
JOIN activities a ON a.lesson_id = l.id AND a.order_index = 2
WHERE u.google_sub = 'mock:demo'
ON CONFLICT (user_id, activity_id) DO NOTHING;

COMMIT;
