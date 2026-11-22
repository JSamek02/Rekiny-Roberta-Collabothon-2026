-- Mockowe kursy dla roadmapy frontendu (PostgreSQL).
-- UWAGA: skrypt trwale usuwa wszystkie kursy, lekcje, aktywności, filmy
-- i postęp kursowy, ale zachowuje użytkowników oraz ich sesje.
-- Nie resetuje sald XP ani SharkCoinów, ponieważ mogą pochodzić z innych modułów.

BEGIN;

TRUNCATE TABLE
    user_activity_progress,
    user_course_enrollments,
    activity_videos,
    activities,
    lessons,
    courses
RESTART IDENTITY;

WITH course_templates (
    slug, title, description, category, title_en, description_en, title_de, description_de
) AS (
    VALUES
        (
            'stocks-bonds-roadmap',
            'Akcje i obligacje',
            'Poznaj podstawowe instrumenty rynku kapitałowego.',
            'stocks-bonds',
            'Stocks and bonds',
            'Learn the essential instruments of the capital market.',
            'Aktien und Anleihen',
            'Lerne die wichtigsten Instrumente des Kapitalmarkts kennen.'
        ),
        (
            'investing-roadmap',
            'Inwestowanie',
            'Zbuduj podstawy świadomego inwestowania krok po kroku.',
            'investing',
            'Investing',
            'Build the foundations of informed investing step by step.',
            'Investieren',
            'Baue Schritt für Schritt die Grundlagen bewussten Investierens auf.'
        ),
        (
            'budgeting-roadmap',
            'Budżetowanie',
            'Uporządkuj swoje finanse osobiste i planuj wydatki.',
            'budgeting',
            'Budgeting',
            'Organise your personal finances and plan your spending.',
            'Budgetplanung',
            'Ordne deine persönlichen Finanzen und plane deine Ausgaben.'
        ),
        (
            'economics-roadmap',
            'Ekonomia',
            'Zrozum najważniejsze mechanizmy gospodarki.',
            'economics',
            'Economics',
            'Understand the key mechanisms of the economy.',
            'Wirtschaft',
            'Verstehe die wichtigsten Mechanismen der Wirtschaft.'
        )
)
INSERT INTO courses (
    slug, title, description, category, difficulty, estimated_minutes,
    icon_url, is_published, translations
)
SELECT
    slug,
    title,
    description,
    category,
    'beginner',
    75,
    NULL,
    TRUE,
    jsonb_build_object(
        'en', jsonb_build_object('title', title_en, 'description', description_en),
        'de', jsonb_build_object('title', title_de, 'description', description_de)
    )
FROM course_templates;

WITH lesson_templates (
    course_slug, order_index, title, description,
    title_en, description_en, title_de, description_de
) AS (
    VALUES
        (
            'stocks-bonds-roadmap', 1,
            'Czym są akcje?', 'Sprawdź, co naprawdę kupujesz, inwestując w akcje.',
            'What are shares?', 'See what you actually buy when you invest in shares.',
            'Was sind Aktien?', 'Erfahre, was du wirklich kaufst, wenn du in Aktien investierst.'
        ),
        (
            'stocks-bonds-roadmap', 2,
            'Jak działają obligacje?', 'Poznaj podstawy pożyczania pieniędzy emitentowi.',
            'How do bonds work?', 'Learn the basics of lending money to an issuer.',
            'Wie funktionieren Anleihen?', 'Lerne die Grundlagen kennen, einem Emittenten Geld zu leihen.'
        ),
        (
            'stocks-bonds-roadmap', 3,
            'Ryzyko i horyzont inwestycyjny', 'Dowiedz się, dlaczego czas i ryzyko idą ze sobą w parze.',
            'Risk and investment horizon', 'Learn why time and risk go hand in hand.',
            'Risiko und Anlagehorizont', 'Erfahre, warum Zeit und Risiko zusammengehören.'
        ),
        (
            'stocks-bonds-roadmap', 4,
            'Pierwszy portfel', 'Połącz akcje i obligacje w prosty portfel.',
            'Your first portfolio', 'Combine shares and bonds into a simple portfolio.',
            'Dein erstes Portfolio', 'Kombiniere Aktien und Anleihen zu einem einfachen Portfolio.'
        ),
        (
            'stocks-bonds-roadmap', 5,
            'Akcje i obligacje: podsumowanie', 'Utrwal najważniejsze różnice między instrumentami.',
            'Stocks and bonds: recap', 'Review the key differences between the instruments.',
            'Aktien und Anleihen: Zusammenfassung', 'Wiederhole die wichtigsten Unterschiede zwischen den Instrumenten.'
        ),
        (
            'investing-roadmap', 1,
            'Po co inwestować?', 'Ustal cel, zanim wybierzesz produkt inwestycyjny.',
            'Why invest?', 'Set a goal before you choose an investment product.',
            'Warum investieren?', 'Setze dir ein Ziel, bevor du ein Anlageprodukt auswählst.'
        ),
        (
            'investing-roadmap', 2,
            'Zysk a ryzyko', 'Poznaj relację między oczekiwanym zyskiem a ryzykiem.',
            'Return and risk', 'Learn the relationship between expected return and risk.',
            'Rendite und Risiko', 'Lerne den Zusammenhang zwischen erwarteter Rendite und Risiko kennen.'
        ),
        (
            'investing-roadmap', 3,
            'ETF w praktyce', 'Zobacz, jak fundusze ETF pomagają w dywersyfikacji.',
            'ETFs in practice', 'See how ETFs can help with diversification.',
            'ETFs in der Praxis', 'Sieh, wie ETFs bei der Diversifikation helfen können.'
        ),
        (
            'investing-roadmap', 4,
            'Regularne inwestowanie', 'Sprawdź, jak działa systematyczne odkładanie pieniędzy.',
            'Regular investing', 'See how investing money regularly works.',
            'Regelmäßig investieren', 'Erfahre, wie regelmäßiges Investieren funktioniert.'
        ),
        (
            'investing-roadmap', 5,
            'Twój plan inwestora', 'Zamień wiedzę w prosty plan działania.',
            'Your investor plan', 'Turn knowledge into a simple action plan.',
            'Dein Anlegerplan', 'Mache aus Wissen einen einfachen Handlungsplan.'
        ),
        (
            'budgeting-roadmap', 1,
            'Twój budżet od zera', 'Zacznij od przejrzystego obrazu swoich finansów.',
            'Your budget from scratch', 'Start with a clear picture of your finances.',
            'Dein Budget von Grund auf', 'Beginne mit einem klaren Bild deiner Finanzen.'
        ),
        (
            'budgeting-roadmap', 2,
            'Przychody i wydatki', 'Rozróżniaj pieniądze, które wpływają i wypływają.',
            'Income and expenses', 'Distinguish money coming in from money going out.',
            'Einnahmen und Ausgaben', 'Unterscheide zwischen eingehendem und ausgehendem Geld.'
        ),
        (
            'budgeting-roadmap', 3,
            'Poduszka finansowa', 'Przygotuj rezerwę na nieprzewidziane sytuacje.',
            'Emergency fund', 'Prepare a reserve for unexpected situations.',
            'Notgroschen', 'Baue eine Reserve für unerwartete Situationen auf.'
        ),
        (
            'budgeting-roadmap', 4,
            'Cele oszczędnościowe', 'Nadaj oszczędzaniu konkretny kierunek.',
            'Saving goals', 'Give your savings a clear direction.',
            'Sparziele', 'Gib deinem Sparen eine klare Richtung.'
        ),
        (
            'budgeting-roadmap', 5,
            'Miesięczny plan finansów', 'Połącz wydatki, cele i rezerwę w jeden plan.',
            'Monthly money plan', 'Combine spending, goals and a reserve in one plan.',
            'Monatlicher Finanzplan', 'Verbinde Ausgaben, Ziele und Reserve in einem Plan.'
        ),
        (
            'economics-roadmap', 1,
            'Gospodarka w pigułce', 'Poznaj uczestników i podstawowe zasady gospodarki.',
            'Economics in a nutshell', 'Meet the key players and rules of an economy.',
            'Wirtschaft kompakt', 'Lerne die wichtigsten Akteure und Regeln einer Wirtschaft kennen.'
        ),
        (
            'economics-roadmap', 2,
            'Inflacja bez tajemnic', 'Zrozum, dlaczego ceny rosną i co to oznacza.',
            'Inflation explained', 'Understand why prices rise and what it means.',
            'Inflation erklärt', 'Verstehe, warum Preise steigen und was das bedeutet.'
        ),
        (
            'economics-roadmap', 3,
            'Stopy procentowe', 'Sprawdź, jak stopy wpływają na kredyty i oszczędności.',
            'Interest rates', 'See how rates affect loans and savings.',
            'Zinssätze', 'Erfahre, wie Zinsen Kredite und Ersparnisse beeinflussen.'
        ),
        (
            'economics-roadmap', 4,
            'Cykl gospodarczy', 'Rozpoznaj wzrost, spowolnienie i ożywienie gospodarki.',
            'Business cycle', 'Recognise economic growth, slowdown and recovery.',
            'Konjunkturzyklus', 'Erkenne Wachstum, Abschwung und Erholung der Wirtschaft.'
        ),
        (
            'economics-roadmap', 5,
            'Ekonomia w codziennych decyzjach', 'Połącz gospodarcze pojęcia z codziennymi wyborami.',
            'Economics in everyday decisions', 'Connect economic concepts with everyday choices.',
            'Wirtschaft im Alltag', 'Verbinde wirtschaftliche Begriffe mit alltäglichen Entscheidungen.'
        )
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
FROM lesson_templates template
JOIN courses c ON c.slug = template.course_slug
ORDER BY c.id, template.order_index;

-- Każda lekcja ma rozwinięty artykuł, trzy pytania sprawdzające i miejsce na film MP4.
WITH lesson_material_templates (course_slug, order_index, article_pl, article_en, article_de) AS (
    VALUES
        (
            'stocks-bonds-roadmap', 1,
            $$## Udział w firmie

Akcja jest małym udziałem w spółce. Kupując ją, nie pożyczasz firmie pieniędzy — stajesz się jednym z jej współwłaścicieli. W praktyce Twoje wyniki zależą od tego, jak firma zarabia, jak rynek ocenia jej przyszłość i za jaką cenę kupiłeś akcję.

## Cena nie jest wartością

Cena akcji zmienia się codziennie, ale sama zmiana ceny nie mówi jeszcze, czy firma jest dobra albo zła. Warto sprawdzić, czym spółka się zajmuje, skąd ma przychody, jakie ma koszty i ryzyka. Głośna marka nie zastępuje analizy.

## Przykład

Jeżeli firma rozwija sprzedaż i zwiększa zyski, rynek może wyceniać ją wyżej. Jeżeli traci klientów albo rosną jej koszty, kurs może spaść. Inwestor uczestniczy w obu scenariuszach.

## Zapamiętaj

- akcja daje udział w spółce, a nie gwarantowany zysk;
- wyższa możliwa nagroda zwykle oznacza też większe ryzyko;
- przed zakupem ustal, dlaczego chcesz posiadać daną firmę.$$,
            $$## Ownership in a company

A share is a small ownership stake in a company. When you buy one, you are not lending the company money — you become one of its owners. Your outcome depends on how the company earns money, how the market sees its future and the price you paid.

## Price is not value

The share price changes every day, but that alone does not tell you whether a company is good or bad. Look at what it sells, where revenue comes from, its costs and its risks. A familiar brand is not a substitute for analysis.

## Example

If a company grows sales and profits, the market may value it more highly. If it loses customers or costs rise, the price may fall. A shareholder participates in both outcomes.

## Remember

- a share gives ownership, not a guaranteed return;
- greater potential reward usually means greater risk;
- decide why you want to own a company before you buy.$$,
            $$## Anteil an einem Unternehmen

Eine Aktie ist ein kleiner Eigentumsanteil an einem Unternehmen. Beim Kauf leihst du der Firma kein Geld, sondern wirst Miteigentümer. Dein Ergebnis hängt davon ab, wie das Unternehmen Geld verdient, wie der Markt seine Zukunft einschätzt und welchen Preis du bezahlt hast.

## Preis ist nicht Wert

Der Aktienkurs ändert sich täglich, sagt aber allein nicht, ob ein Unternehmen gut oder schlecht ist. Schau dir Geschäftsmodell, Einnahmen, Kosten und Risiken an. Eine bekannte Marke ersetzt keine Analyse.

## Beispiel

Steigen Umsatz und Gewinn, kann der Markt das Unternehmen höher bewerten. Verliert es Kunden oder steigen die Kosten, kann der Kurs fallen. An beiden Entwicklungen nimmt ein Aktionär teil.

## Merke

- eine Aktie bedeutet Eigentum, keinen garantierten Gewinn;
- höhere Chancen gehen meist mit höheren Risiken einher;
- kläre vor dem Kauf, warum du das Unternehmen besitzen möchtest.$$
        ),
        (
            'stocks-bonds-roadmap', 2,
            $$## Pożyczka zamiast udziału

Obligacja jest papierem dłużnym. Kupując ją, pożyczasz pieniądze państwu, samorządowi albo firmie. Emitent obiecuje wypłacać odsetki i zwrócić kapitał w określonym terminie. Nie stajesz się współwłaścicielem emitenta.

## Trzy pytania przed zakupem

Sprawdź, kto pożycza pieniądze, kiedy ma je oddać i jak wysokie jest oprocentowanie. Ważna jest też wiarygodność emitenta: nawet obietnica zwrotu nie eliminuje ryzyka niewypłacalności.

## Stopy procentowe mają znaczenie

Gdy rynkowe stopy rosną, stare obligacje o niższym kuponie zwykle stają się mniej atrakcyjne, więc ich cena może spaść. Im dłuższy czas do wykupu, tym mocniej cena zwykle reaguje na zmianę stóp.

## Zapamiętaj

- odsetki nie oznaczają braku ryzyka;
- obligacja ma termin wykupu, ale można ją sprzedać wcześniej po cenie rynkowej;
- warto rozłożyć ryzyko między różnych emitentów i terminy.$$,
            $$## A loan rather than ownership

A bond is a debt security. By buying it, you lend money to a government, municipality or company. The issuer promises interest payments and repayment of principal on a stated date. You do not become an owner of the issuer.

## Three questions before buying

Check who is borrowing, when repayment is due and what interest is offered. The issuer’s creditworthiness matters too: a promise to repay does not remove the risk of default.

## Interest rates matter

When market rates rise, older bonds with a lower coupon are usually less attractive, so their price can fall. The longer the time to maturity, the more strongly price usually reacts to rate changes.

## Remember

- interest does not mean zero risk;
- a bond has a maturity date, but it can be sold earlier at a market price;
- spread risk across issuers and maturities.$$,
            $$## Ein Darlehen statt Eigentum

Eine Anleihe ist ein Schuldtitel. Mit dem Kauf leihst du einem Staat, einer Kommune oder einem Unternehmen Geld. Der Emittent verspricht Zinszahlungen und die Rückzahlung des Kapitals zu einem festgelegten Termin. Du wirst nicht Miteigentümer.

## Drei Fragen vor dem Kauf

Prüfe, wer Geld leiht, wann es zurückgezahlt wird und welche Zinsen angeboten werden. Auch die Bonität zählt: Ein Rückzahlungsversprechen beseitigt das Ausfallrisiko nicht.

## Zinssätze sind wichtig

Steigen die Marktzinsen, werden ältere Anleihen mit niedrigerem Kupon meist weniger attraktiv und ihr Preis kann fallen. Je länger die Laufzeit, desto stärker reagiert der Preis gewöhnlich auf Zinsänderungen.

## Merke

- Zinsen bedeuten nicht risikofrei;
- eine Anleihe hat eine Laufzeit, kann aber vorher zum Marktpreis verkauft werden;
- verteile Risiken auf Emittenten und Laufzeiten.$$
        ),
        (
            'stocks-bonds-roadmap', 3,
            $$## Ryzyko ma wiele twarzy

Ryzyko inwestycyjne to nie tylko spadek kursu. Może oznaczać inflację zjadającą siłę nabywczą, trudność ze sprzedażą aktywa, niewypłacalność emitenta albo podjęcie decyzji w panice. Pierwszym krokiem jest nazwanie ryzyka, którego nie chcesz ponosić.

## Horyzont zmienia decyzję

Pieniądze potrzebne za rok na wkład własny powinny być traktowane inaczej niż środki na cel odległy o kilkanaście lat. Krótki termin daje mniej czasu na odrobienie spadków, dlatego zwykle wymaga większej ostrożności.

## Prosty test

Wyobraź sobie spadek wartości portfela o 20%. Czy nadal mógłbyś realizować swój cel bez sprzedaży w złym momencie? Jeśli nie, poziom ryzyka jest prawdopodobnie za wysoki.

## Zapamiętaj

- dopasuj aktywa do terminu i celu;
- dywersyfikacja ogranicza ryzyko pojedynczego błędu, ale go nie usuwa;
- plan jest najcenniejszy przed trudnym momentem, nie w jego trakcie.$$,
            $$## Risk has many forms

Investment risk is not only a falling price. It can mean inflation reducing purchasing power, difficulty selling an asset, an issuer defaulting or making a decision in panic. The first step is naming the risk you do not want to take.

## Horizon changes the decision

Money needed in one year for a home deposit should be treated differently from money for a goal fifteen years away. A short horizon leaves less time to recover from losses and usually calls for more caution.

## A simple test

Imagine your portfolio falls by 20%. Could you still meet your goal without selling at the worst moment? If not, the level of risk is probably too high.

## Remember

- match assets to your goal and time horizon;
- diversification limits a single mistake but does not remove all risk;
- a plan matters most before a difficult moment, not during it.$$,
            $$## Risiko hat viele Formen

Anlagerisiko bedeutet nicht nur fallende Kurse. Es kann Inflation, eine schwierige Verkäuflichkeit, einen Zahlungsausfall oder eine Entscheidung aus Panik bedeuten. Der erste Schritt ist, das Risiko zu benennen, das du nicht tragen möchtest.

## Der Horizont verändert die Entscheidung

Geld für eine Anzahlung in einem Jahr behandelt man anders als Geld für ein Ziel in fünfzehn Jahren. Bei einem kurzen Horizont bleibt weniger Zeit, Verluste auszugleichen; daher ist meist mehr Vorsicht nötig.

## Ein einfacher Test

Stell dir vor, dein Portfolio verliert 20 Prozent. Könntest du dein Ziel trotzdem erreichen, ohne zum schlechtesten Zeitpunkt zu verkaufen? Wenn nicht, ist das Risiko wahrscheinlich zu hoch.

## Merke

- stimme Anlagen auf Ziel und Zeithorizont ab;
- Diversifikation begrenzt einzelne Fehler, beseitigt aber nicht jedes Risiko;
- ein Plan ist vor einem schwierigen Moment am wertvollsten.$$
        ),
        (
            'stocks-bonds-roadmap', 4,
            $$## Portfel zaczyna się od proporcji

Portfel to nie lista przypadkowych instrumentów, lecz zestaw aktywów dopasowany do celu. Akcje mogą dawać większy potencjał wzrostu, a obligacje mogą stabilizować część środków. Właściwa proporcja zależy od czasu, potrzeby płynności i tolerancji na wahania.

## Najpierw fundamenty

Zanim zainwestujesz, zadbaj o bieżące rachunki i rezerwę na nagłe wydatki. Pieniądze, których możesz potrzebować szybko, nie powinny być uzależnione od krótkoterminowych ruchów rynku.

## Rebalansowanie

Jeśli akcje rosną szybciej niż obligacje, ich udział w portfelu może stać się większy, niż planowałeś. Rebalansowanie polega na okresowym powrocie do ustalonych proporcji, a nie na zgadywaniu kolejnego ruchu rynku.

## Zapamiętaj

- wybierz proporcje przed zakupem;
- nie kopiuj portfela bez znajomości cudzego celu;
- kontroluj plan regularnie, ale nie reaguj na każdy nagłówek.$$,
            $$## A portfolio starts with allocation

A portfolio is not a random list of instruments. It is a set of assets matched to a goal. Shares may offer more growth potential, while bonds can stabilise part of the money. The right mix depends on time, liquidity needs and tolerance for fluctuations.

## Build the foundation first

Before investing, cover current bills and keep a reserve for emergencies. Money you may need soon should not depend on short-term market moves.

## Rebalancing

If shares rise faster than bonds, their share of the portfolio can become larger than planned. Rebalancing means periodically returning to your target allocation, not guessing the market’s next move.

## Remember

- choose the mix before buying;
- do not copy a portfolio without knowing the other person’s goal;
- review the plan regularly, but do not react to every headline.$$,
            $$## Ein Portfolio beginnt mit der Aufteilung

Ein Portfolio ist keine zufällige Liste von Instrumenten, sondern eine auf ein Ziel abgestimmte Zusammenstellung. Aktien können mehr Wachstumspotenzial bieten, Anleihen können einen Teil des Vermögens stabilisieren. Die richtige Mischung hängt von Zeit, Liquiditätsbedarf und Schwankungstoleranz ab.

## Zuerst das Fundament

Decke vor dem Investieren laufende Rechnungen und Notfälle ab. Geld, das du bald brauchst, sollte nicht von kurzfristigen Marktbewegungen abhängen.

## Rebalancing

Steigen Aktien stärker als Anleihen, kann ihr Anteil größer werden als geplant. Rebalancing bedeutet, regelmäßig zur Zielaufteilung zurückzukehren — nicht die nächste Marktbewegung zu erraten.

## Merke

- lege die Aufteilung vor dem Kauf fest;
- kopiere kein Portfolio ohne das Ziel der anderen Person zu kennen;
- überprüfe den Plan regelmäßig, reagiere aber nicht auf jede Schlagzeile.$$
        ),
        (
            'stocks-bonds-roadmap', 5,
            $$## Dwa różne źródła wyniku

Akcjonariusz uczestniczy w sukcesie lub problemach firmy. Posiadacz obligacji przede wszystkim oczekuje odsetek i zwrotu kapitału. Dlatego akcje i obligacje mogą pełnić inne role w tym samym portfelu.

## Porównuj warunki, nie etykiety

Nie każda obligacja jest bezpieczna, a nie każda akcja jest równie ryzykowna. Znaczenie mają między innymi kondycja emitenta, cena zakupu, czas inwestycji i to, czy rozumiesz instrument.

## Jak wykorzystać tę wiedzę

Zacznij od celu: wzrost kapitału, dochód, zachowanie płynności albo połączenie tych potrzeb. Następnie sprawdź, które aktywa pomagają osiągnąć cel bez ryzyka, którego nie zaakceptujesz.

## Zapamiętaj

- akcje i obligacje nie konkurują ze sobą w każdej sytuacji;
- cena i ryzyko zmieniają się w czasie;
- świadoma decyzja wymaga celu, informacji i cierpliwości.$$,
            $$## Two different sources of return

A shareholder participates in a company’s success or problems. A bondholder mainly expects interest and repayment of principal. That is why shares and bonds can serve different roles in the same portfolio.

## Compare terms, not labels

Not every bond is safe and not every share carries the same risk. The issuer’s condition, purchase price, investment horizon and your understanding of the instrument all matter.

## Use this knowledge

Start with the goal: capital growth, income, liquidity or a combination. Then ask which assets can support that goal without exposing you to risk you would not accept.

## Remember

- shares and bonds do not compete in every situation;
- price and risk change over time;
- an informed decision needs a goal, information and patience.$$,
            $$## Zwei unterschiedliche Ertragsquellen

Ein Aktionär nimmt am Erfolg oder an Problemen eines Unternehmens teil. Ein Anleiheinhaber erwartet vor allem Zinsen und die Rückzahlung des Kapitals. Deshalb können Aktien und Anleihen in einem Portfolio unterschiedliche Aufgaben haben.

## Bedingungen statt Etiketten vergleichen

Nicht jede Anleihe ist sicher und nicht jede Aktie hat dasselbe Risiko. Bonität, Kaufpreis, Anlagehorizont und dein Verständnis des Instruments sind wichtig.

## Dieses Wissen nutzen

Beginne mit dem Ziel: Kapitalwachstum, Einkommen, Liquidität oder eine Kombination. Frage dann, welche Anlagen dieses Ziel unterstützen, ohne ein Risiko einzugehen, das du nicht akzeptierst.

## Merke

- Aktien und Anleihen konkurrieren nicht in jeder Situation;
- Preis und Risiko verändern sich mit der Zeit;
- eine bewusste Entscheidung braucht Ziel, Information und Geduld.$$
        ),
        (
            'investing-roadmap', 1,
            $$## Inwestowanie ma służyć celowi

Inwestowanie nie zaczyna się od wyboru aplikacji ani „najlepszego” instrumentu. Zaczyna się od odpowiedzi, po co odkładasz pieniądze: emerytura, wkład własny, edukacja czy większe bezpieczeństwo finansowe. Cel wyznacza termin i poziom ryzyka, który możesz zaakceptować.

## Oddziel rezerwę od inwestycji

Poduszka na nieprzewidziane wydatki powinna być łatwo dostępna. Inwestycje mogą tracić wartość w krótkim terminie, dlatego nie warto przeznaczać na nie pieniędzy potrzebnych do opłacenia pilnego rachunku.

## Nadaj celowi liczby

Zapisz potrzebną kwotę, termin i miesięczną wpłatę. Przykład: cel 12 000 zł za trzy lata oznacza około 334 zł miesięcznie przed uwzględnieniem ewentualnego zysku. Liczby pomagają ocenić, czy plan jest realny.

## Zapamiętaj

- cel jest ważniejszy niż modny produkt;
- im krótszy termin, tym ostrożniejsza powinna być strategia;
- plan warto aktualizować po zmianie dochodów lub priorytetów.$$,
            $$## Investing should serve a goal

Investing does not begin with choosing an app or the “best” instrument. It begins by answering why you save: retirement, a home deposit, education or greater financial security. The goal sets the time horizon and the amount of risk you can accept.

## Separate your reserve from investments

An emergency reserve should be easy to access. Investments can lose value in the short term, so money needed for an urgent bill should not be invested.

## Give the goal numbers

Write down the required amount, deadline and monthly contribution. For example, a goal of 12,000 PLN in three years is about 334 PLN a month before any return. Numbers show whether the plan is realistic.

## Remember

- the goal matters more than a fashionable product;
- the shorter the horizon, the more cautious the strategy should be;
- update the plan when income or priorities change.$$,
            $$## Investieren soll einem Ziel dienen

Investieren beginnt nicht mit einer App oder dem „besten“ Instrument. Es beginnt mit der Frage, wofür du Geld zurücklegst: Ruhestand, Eigenkapital, Bildung oder mehr finanzielle Sicherheit. Das Ziel bestimmt den Horizont und das Risiko, das du tragen kannst.

## Reserve und Anlagen trennen

Eine Notfallreserve sollte leicht verfügbar sein. Anlagen können kurzfristig an Wert verlieren; Geld für eine dringende Rechnung sollte daher nicht investiert werden.

## Dem Ziel Zahlen geben

Notiere Zielbetrag, Termin und Monatsrate. Ein Ziel von 12.000 PLN in drei Jahren bedeutet vor möglichen Erträgen etwa 334 PLN monatlich. Zahlen zeigen, ob ein Plan realistisch ist.

## Merke

- das Ziel ist wichtiger als ein modisches Produkt;
- je kürzer der Horizont, desto vorsichtiger die Strategie;
- aktualisiere den Plan bei Änderungen von Einkommen oder Prioritäten.$$
        ),
        (
            'investing-roadmap', 2,
            $$## Zysk nie jest obietnicą

Oczekiwany zysk to wynagrodzenie za czas, ryzyko i rezygnację z bieżącego wydawania pieniędzy. Nie jest gwarancją. Dwie inwestycje o podobnym potencjale mogą mieć zupełnie inne źródła ryzyka: wahania rynku, koncentrację na jednej branży, kurs waluty lub zadłużenie emitenta.

## Wahania a trwała strata

Wahanie wartości jest normalne na rynku, ale nie każde aktywo wraca do poprzedniej ceny. Dlatego ważne są jakość instrumentu, cena zakupu i dywersyfikacja, a nie tylko historia wykresu.

## Nie oceniaj planu po tygodniu

Strategię długoterminową należy mierzyć względem celu i założeń, nie względem jednego nagłówka. Jeżeli spadek kursu zmusza Cię do sprzedaży, problemem może być zbyt duże ryzyko lub zbyt krótki horyzont.

## Zapamiętaj

- wyższa prognoza zysku nie usuwa ryzyka;
- dywersyfikacja rozkłada źródła ryzyka;
- inwestuj tylko w to, czego mechanizm rozumiesz.$$,
            $$## Return is not a promise

Expected return is compensation for time, risk and postponing current spending. It is not a guarantee. Two investments with similar potential can have very different risks: market swings, concentration in one sector, currency movements or issuer debt.

## Fluctuation versus permanent loss

Fluctuation is normal in markets, but not every asset returns to its previous price. That is why instrument quality, purchase price and diversification matter more than a chart’s history alone.

## Do not judge a plan after one week

Measure a long-term strategy against its goal and assumptions, not one headline. If a price fall forces you to sell, the risk may be too high or the horizon too short.

## Remember

- a higher expected return does not remove risk;
- diversification spreads sources of risk;
- invest only in mechanisms you understand.$$,
            $$## Rendite ist kein Versprechen

Erwartete Rendite ist eine Vergütung für Zeit, Risiko und aufgeschobenen Konsum. Sie ist keine Garantie. Zwei Anlagen mit ähnlichem Potenzial können sehr unterschiedliche Risiken haben: Marktschwankungen, Konzentration auf eine Branche, Währung oder Verschuldung des Emittenten.

## Schwankung oder dauerhafter Verlust

Schwankungen sind an Märkten normal, aber nicht jedes Asset kehrt zu seinem alten Preis zurück. Deshalb zählen Qualität, Kaufpreis und Diversifikation mehr als nur die Kursgeschichte.

## Einen Plan nicht nach einer Woche bewerten

Miss eine langfristige Strategie an Ziel und Annahmen, nicht an einer Schlagzeile. Wenn ein Kursrückgang dich zum Verkauf zwingt, ist das Risiko vielleicht zu hoch oder der Horizont zu kurz.

## Merke

- höhere erwartete Rendite beseitigt kein Risiko;
- Diversifikation verteilt Risikoquellen;
- investiere nur in Mechanismen, die du verstehst.$$
        ),
        (
            'investing-roadmap', 3,
            $$## Co kupujesz przez ETF

ETF to fundusz notowany na giełdzie. Jedną transakcją możesz kupić udział w koszyku akcji albo obligacji, zamiast wybierać pojedyncze spółki. To narzędzie, nie gotowa strategia: dwa ETF-y mogą śledzić różne rynki, mieć inne koszty i różne ryzyka.

## Sprawdź indeks i koszty

Nazwa funduszu nie wystarczy. Zobacz, jaki indeks śledzi, ile pozycji obejmuje, w jakiej walucie jest notowany i jaki ma roczny koszt. Niski koszt nie naprawi źle dopasowanego celu, ale w długim terminie może mieć znaczenie.

## Akumulacja czy wypłata

Fundusz akumulujący zwykle reinwestuje otrzymane dywidendy, a dystrybucyjny je wypłaca. Wybór zależy od celu, podatków i tego, czy potrzebujesz bieżącego dochodu.

## Zapamiętaj

- ETF daje ekspozycję na koszyk aktywów, nie gwarancję zysku;
- szeroki indeks nie oznacza braku ryzyka;
- przeczytaj dokument informacyjny, zanim kupisz.$$,
            $$## What you buy through an ETF

An ETF is a fund traded on an exchange. With one transaction you can buy a stake in a basket of shares or bonds instead of selecting individual companies. It is a tool, not a ready-made strategy: two ETFs can track different markets, have different costs and different risks.

## Check the index and costs

The fund name is not enough. Check which index it follows, how many holdings it has, its trading currency and annual fee. A low fee cannot fix a mismatched goal, but it can matter over a long horizon.

## Accumulating or distributing

An accumulating fund usually reinvests dividends, while a distributing fund pays them out. The choice depends on your goal, taxes and whether you need current income.

## Remember

- an ETF gives exposure to a basket of assets, not a guaranteed return;
- a broad index does not mean no risk;
- read the key information document before buying.$$,
            $$## Was du über einen ETF kaufst

Ein ETF ist ein börsengehandelter Fonds. Mit einer Transaktion kannst du einen Anteil an einem Korb aus Aktien oder Anleihen kaufen, statt einzelne Unternehmen auszuwählen. Er ist ein Werkzeug, keine fertige Strategie: Zwei ETFs können unterschiedliche Märkte abbilden, andere Kosten und Risiken haben.

## Index und Kosten prüfen

Der Fondsname reicht nicht. Prüfe den Index, die Zahl der Positionen, Handelswährung und jährliche Kosten. Niedrige Kosten ersetzen kein passendes Ziel, können aber langfristig wichtig sein.

## Thesaurierend oder ausschüttend

Ein thesaurierender Fonds reinvestiert Dividenden meist, ein ausschüttender zahlt sie aus. Die Wahl hängt von Ziel, Steuern und dem Bedarf an laufenden Erträgen ab.

## Merke

- ein ETF bietet Zugang zu einem Korb von Anlagen, keine garantierte Rendite;
- ein breiter Index bedeutet nicht risikofrei;
- lies vor dem Kauf das Basisinformationsblatt.$$
        ),
        (
            'investing-roadmap', 4,
            $$## Regularność zamiast idealnego momentu

Regularne inwestowanie oznacza wpłacanie ustalonej kwoty w stałych odstępach czasu. Dzięki temu kupujesz więcej jednostek, gdy ceny są niższe, i mniej, gdy są wyższe. Nie gwarantuje to zysku, ale ogranicza presję, by zgadywać najlepszy dzień na wejście.

## Najpierw budżet

Stała wpłata powinna być możliwa także w zwykłym miesiącu. Lepiej zacząć od mniejszej kwoty, którą utrzymasz, niż od ambitnej deklaracji, którą szybko przerwiesz. Automatyczne przelewy pomagają zamienić zamiar w nawyk.

## Ustal zasady na gorszy okres

Zapisz z góry, kiedy zmniejszysz wpłatę lub ją zatrzymasz — na przykład po utracie dochodu albo gdy potrzebujesz odbudować rezerwę. To nie porażka planu, lecz jego część.

## Zapamiętaj

- regularność nie eliminuje ryzyka rynku;
- nie inwestuj kosztem rachunków i poduszki finansowej;
- prosty plan jest łatwiejszy do utrzymania niż perfekcyjny plan bez działania.$$,
            $$## Consistency rather than perfect timing

Regular investing means putting in a fixed amount at regular intervals. You buy more units when prices are lower and fewer when they are higher. It does not guarantee a return, but it reduces the pressure to guess the best day to start.

## Start with the budget

A regular contribution should be possible in an ordinary month. It is better to start with a smaller amount you can sustain than an ambitious promise you quickly abandon. Automatic transfers turn intention into a habit.

## Set rules for difficult periods

Write down when you would reduce or stop a contribution — for example after losing income or when rebuilding your reserve. That is not a failure of the plan; it is part of it.

## Remember

- regularity does not remove market risk;
- do not invest at the expense of bills and an emergency fund;
- a simple plan you follow is better than a perfect plan you never use.$$,
            $$## Regelmäßigkeit statt perfektem Timing

Regelmäßiges Investieren bedeutet, in festen Abständen einen festgelegten Betrag anzulegen. Bei niedrigeren Preisen kaufst du mehr Einheiten, bei höheren weniger. Das garantiert keine Rendite, verringert aber den Druck, den perfekten Einstiegszeitpunkt zu erraten.

## Mit dem Budget beginnen

Eine regelmäßige Rate muss auch in einem normalen Monat möglich sein. Ein kleiner Betrag, den du durchhältst, ist besser als ein ehrgeiziges Versprechen, das du schnell aufgibst. Automatische Überweisungen machen aus einer Absicht eine Gewohnheit.

## Regeln für schwierige Zeiten festlegen

Schreibe auf, wann du die Rate senkst oder pausierst — etwa nach Einkommensverlust oder beim Wiederaufbau der Reserve. Das ist kein Scheitern des Plans, sondern Teil davon.

## Merke

- Regelmäßigkeit beseitigt kein Marktrisiko;
- investiere nicht auf Kosten von Rechnungen und Notgroschen;
- ein einfacher umgesetzter Plan ist besser als ein perfekter ungenutzter.$$
        ),
        (
            'investing-roadmap', 5,
            $$## Plan to zestaw reguł

Plan inwestora nie musi być skomplikowany. Wystarczy, że odpowiada na kilka pytań: jaki jest cel, kiedy potrzebujesz pieniędzy, ile możesz wpłacać, jakie wahania akceptujesz i co zrobisz, gdy sytuacja się zmieni.

## Zapisz decyzje przed emocjami

Z góry określ proporcje aktywów, częstotliwość wpłat i moment przeglądu planu. Wtedy gorszy dzień na rynku nie musi prowadzić do impulsywnej zmiany strategii.

## Mierz to, co ma znaczenie

Nie oceniaj powodzenia tylko po bieżącym wyniku. Sprawdź, czy realizujesz wpłaty, czy poziom ryzyka nadal pasuje do celu i czy koszty są rozsądne. To są elementy, na które masz wpływ.

## Zapamiętaj

- plan powinien być prosty i zapisany;
- zmieniaj go po zmianie celu, nie po każdej zmianie kursu;
- korzystanie z profesjonalnej porady może być rozsądne przy złożonej sytuacji.$$,
            $$## A plan is a set of rules

An investor plan does not need to be complicated. It only needs to answer a few questions: what is the goal, when will you need the money, how much can you contribute, which fluctuations can you accept and what will you do if circumstances change?

## Make decisions before emotions

Set your asset mix, contribution frequency and review date in advance. Then a bad market day does not have to cause an impulsive strategy change.

## Measure what matters

Do not judge success only by the current result. Check whether you make contributions, whether risk still fits the goal and whether costs are reasonable. Those are things you can influence.

## Remember

- keep the plan simple and written down;
- change it when the goal changes, not after every price move;
- professional advice can be sensible in a complex situation.$$,
            $$## Ein Plan ist ein Regelwerk

Ein Anlegerplan muss nicht kompliziert sein. Er sollte einige Fragen beantworten: Was ist das Ziel, wann brauchst du das Geld, wie viel kannst du einzahlen, welche Schwankungen akzeptierst du und was tust du bei veränderten Umständen?

## Vor den Emotionen entscheiden

Lege Vermögensaufteilung, Einzahlungsrhythmus und Überprüfungstermin im Voraus fest. Dann muss ein schlechter Börsentag nicht zu einer impulsiven Änderung führen.

## Das messen, was zählt

Bewerte Erfolg nicht nur am aktuellen Ergebnis. Prüfe, ob du einzahlst, ob das Risiko noch zum Ziel passt und ob die Kosten angemessen sind. Das sind Punkte, die du beeinflussen kannst.

## Merke

- halte den Plan einfach und schriftlich fest;
- ändere ihn bei einem neuen Ziel, nicht bei jeder Kursbewegung;
- bei komplexen Situationen kann professionelle Beratung sinnvoll sein.$$
        ),
        (
            'budgeting-roadmap', 1,
            $$## Budżet to plan, nie kara

Budżet pokazuje, co chcesz zrobić z pieniędzmi, zanim zrobią to przypadkowe wydatki. Nie wymaga idealnej kontroli każdego grosza. Ma pomóc zobaczyć, ile wpływa, ile wychodzi i czy Twoje decyzje wspierają najważniejsze cele.

## Zacznij od historii

Przejrzyj ostatni miesiąc konta i karty. Podziel wydatki na stałe, zmienne i okazjonalne. Stałe to na przykład czynsz, a okazjonalne mogą obejmować prezenty, naprawy lub roczne opłaty — łatwo o nich zapomnieć.

## Daj każdej złotówce zadanie

Po opłaceniu potrzeb zaplanuj oszczędności, spłatę zobowiązań i przyjemności. Kwota na rozrywkę nie jest błędem, jeśli została świadomie uwzględniona.

## Zapamiętaj

- budżet ma odzwierciedlać rzeczywistość, a nie idealne życie;
- nieprzewidziane wydatki warto zamienić w osobną kategorię;
- pierwsza wersja planu jest punktem startu do poprawy.$$,
            $$## A budget is a plan, not a punishment

A budget shows what you want to do with money before random spending does it for you. It does not require perfect control of every penny. It helps you see what comes in, what goes out and whether decisions support your main goals.

## Start with history

Review the last month of your bank account and card. Split spending into fixed, variable and occasional costs. Fixed costs include rent; occasional costs can include gifts, repairs or annual fees that are easy to forget.

## Give every unit of money a job

After covering needs, plan savings, debt repayment and enjoyment. A leisure amount is not a mistake if you included it consciously.

## Remember

- a budget should reflect reality, not an ideal life;
- turn irregular costs into a separate category;
- the first version is a starting point for improvement.$$,
            $$## Ein Budget ist ein Plan, keine Strafe

Ein Budget zeigt, was du mit Geld tun möchtest, bevor zufällige Ausgaben darüber entscheiden. Es verlangt keine perfekte Kontrolle über jeden Cent. Es hilft dir zu sehen, was hereinkommt, was hinausgeht und ob Entscheidungen deine wichtigsten Ziele unterstützen.

## Mit der Vergangenheit beginnen

Sieh dir den letzten Monat auf Konto und Karte an. Teile Ausgaben in feste, variable und gelegentliche Kosten. Zu den festen Kosten gehört Miete; gelegentlich sind etwa Geschenke, Reparaturen oder Jahresgebühren, die man leicht vergisst.

## Gib jedem Euro eine Aufgabe

Plane nach den notwendigen Ausgaben Sparen, Schuldentilgung und Freizeit. Ein Freizeitbudget ist kein Fehler, wenn es bewusst eingeplant ist.

## Merke

- ein Budget soll die Realität abbilden, nicht ein ideales Leben;
- unregelmäßige Ausgaben verdienen eine eigene Kategorie;
- die erste Version ist der Anfang der Verbesserung.$$
        ),
        (
            'budgeting-roadmap', 2,
            $$## Przepływ pieniędzy mówi więcej niż saldo

Saldo konta jest zdjęciem z jednej chwili. Przychody i wydatki pokazują film: czy co miesiąc zostaje nadwyżka, czy powstaje luka, którą później trzeba pokrywać kredytem albo oszczędnościami.

## Rozróżniaj potrzeby i zachcianki

To nie jest konkurs moralny. Jedzenie, transport i mieszkanie mogą być potrzebami, ale ich koszt nadal można porównać z alternatywami. Zachcianki też mają miejsce w budżecie, jeśli znasz ich cenę i nie wypierają ważniejszych celów.

## Znajdź największe dźwignie

Nie musisz zaczynać od najdrobniejszych wydatków. Często większą różnicę robi renegocjacja stałej opłaty, ograniczenie kosztownej subskrypcji lub lepsze planowanie zakupów.

## Zapamiętaj

- dodatni przepływ pieniężny daje wybór;
- kategorie pomagają zauważyć wzorce, nie oceniać siebie;
- sprawdzaj budżet przynajmniej raz w tygodniu.$$,
            $$## Cash flow says more than a balance

Your account balance is a snapshot. Income and expenses show the film: whether a surplus remains each month or a gap develops that later needs credit or savings to cover it.

## Separate needs from wants

This is not a moral contest. Food, transport and housing can be needs, but their cost can still be compared with alternatives. Wants also have a place in a budget if you know their price and they do not displace more important goals.

## Find the biggest levers

You do not have to start with the smallest expenses. Renegotiating a fixed bill, cancelling an expensive subscription or planning purchases better can often make a larger difference.

## Remember

- positive cash flow gives you choices;
- categories reveal patterns rather than judge you;
- check the budget at least once a week.$$,
            $$## Geldfluss sagt mehr als ein Kontostand

Der Kontostand ist eine Momentaufnahme. Einnahmen und Ausgaben zeigen den Film: Bleibt monatlich ein Überschuss oder entsteht eine Lücke, die später durch Kredit oder Ersparnisse gedeckt werden muss?

## Bedürfnisse und Wünsche trennen

Das ist kein moralischer Wettbewerb. Essen, Transport und Wohnen können Bedürfnisse sein, ihre Kosten lassen sich aber trotzdem vergleichen. Auch Wünsche haben Platz im Budget, wenn du ihren Preis kennst und sie wichtigere Ziele nicht verdrängen.

## Die größten Hebel finden

Du musst nicht mit den kleinsten Ausgaben anfangen. Eine feste Rechnung neu zu verhandeln, ein teures Abo zu kündigen oder Einkäufe besser zu planen, bewirkt oft mehr.

## Merke

- positiver Cashflow schafft Wahlmöglichkeiten;
- Kategorien zeigen Muster, sie bewerten dich nicht;
- prüfe dein Budget mindestens einmal pro Woche.$$
        ),
        (
            'budgeting-roadmap', 3,
            $$## Rezerwa kupuje czas

Poduszka finansowa to pieniądze na nagłe, ważne wydatki lub przejściowy spadek dochodu. Jej zadaniem nie jest maksymalizacja zysku, lecz ograniczenie potrzeby zaciągania drogiego długu albo sprzedaży inwestycji w niekorzystnym momencie.

## Ile odłożyć?

Nie ma jednej liczby dla wszystkich. Punkt odniesienia to kilka miesięcy niezbędnych wydatków, ale wysokość rezerwy zależy od stabilności dochodu, liczby osób na utrzymaniu, ubezpieczeń i możliwości wsparcia.

## Gdzie trzymać rezerwę?

Priorytetem jest bezpieczeństwo i szybki dostęp. Oddzielne konto oszczędnościowe może pomóc nie wydać tych środków przypadkiem. Rezerwy nie mieszaj z pieniędzmi na wakacje ani z inwestycjami długoterminowymi.

## Zapamiętaj

- buduj poduszkę małymi, regularnymi wpłatami;
- użyj jej bez poczucia winy przy prawdziwej potrzebie;
- po wykorzystaniu wróć do jej odbudowy.$$,
            $$## A reserve buys time

An emergency fund is money for sudden important costs or a temporary loss of income. Its job is not to maximise return but to reduce the need for expensive debt or selling investments at a poor moment.

## How much should you save?

There is no single number for everyone. Several months of essential spending is a useful reference, but the amount depends on income stability, dependants, insurance and available support.

## Where should it sit?

Safety and quick access are priorities. A separate savings account can help prevent accidental spending. Do not mix the reserve with holiday money or long-term investments.

## Remember

- build the fund with small, regular contributions;
- use it without guilt for a genuine need;
- rebuild it after using it.$$,
            $$## Eine Reserve kauft Zeit

Ein Notgroschen ist Geld für plötzlich wichtige Kosten oder einen vorübergehenden Einkommensverlust. Seine Aufgabe ist nicht maximale Rendite, sondern die Vermeidung teurer Schulden oder eines Verkaufs von Anlagen zum ungünstigen Zeitpunkt.

## Wie viel zurücklegen?

Eine Zahl passt nicht für alle. Mehrere Monate notwendiger Ausgaben sind ein sinnvoller Anhaltspunkt, doch die Höhe hängt von Einkommenssicherheit, Unterhaltspflichten, Versicherungen und Unterstützung ab.

## Wo aufbewahren?

Sicherheit und schneller Zugriff haben Vorrang. Ein separates Sparkonto kann vor versehentlichen Ausgaben schützen. Mische die Reserve nicht mit Urlaubsgeld oder langfristigen Anlagen.

## Merke

- baue die Reserve mit kleinen regelmäßigen Beiträgen auf;
- nutze sie ohne Schuldgefühl bei echtem Bedarf;
- fülle sie nach der Nutzung wieder auf.$$
        ),
        (
            'budgeting-roadmap', 4,
            $$## Cel zamienia oszczędzanie w decyzję

„Chcę więcej oszczędzać” jest dobrym zamiarem, ale trudnym planem. Cel staje się użyteczny, gdy ma kwotę, termin i priorytet. Wtedy możesz obliczyć miesięczną wpłatę i sprawdzić, czy nie konkuruje z ważniejszymi potrzebami.

## Podziel cele według czasu

Krótki cel, na przykład sprzęt za pół roku, wymaga głównie bezpiecznego przechowania pieniędzy. Cel odległy może pozwolić na większe wahania, ale nadal potrzebuje realnych założeń i regularnego sprawdzania.

## Użyj osobnych „kopert”

Oddzielne subkonta albo prosta tabela pomagają nie mieszać pieniędzy na różne cele. Dzięki temu wydatek na jeden cel nie wygląda jak niewyjaśnione zniknięcie oszczędności.

## Zapamiętaj

- jeden konkretny cel jest lepszy niż pięć nieokreślonych;
- uwzględnij koszty dodatkowe i wzrost cen;
- celebruj kamienie milowe, ale nie rezygnuj z rezerwy.$$,
            $$## A goal turns saving into a decision

“I want to save more” is a good intention but a difficult plan. A goal becomes useful when it has an amount, deadline and priority. Then you can calculate a monthly contribution and see whether it competes with more important needs.

## Split goals by time

A short goal, such as equipment in six months, mainly requires safe storage of money. A distant goal can allow more fluctuation, but still needs realistic assumptions and regular review.

## Use separate envelopes

Separate subaccounts or a simple spreadsheet help avoid mixing money for different goals. Then spending on one goal does not look like unexplained disappearing savings.

## Remember

- one concrete goal is better than five vague ones;
- include extra costs and rising prices;
- celebrate milestones without giving up your emergency reserve.$$,
            $$## Ein Ziel macht Sparen zu einer Entscheidung

„Ich möchte mehr sparen“ ist eine gute Absicht, aber ein schwieriger Plan. Ein Ziel wird nützlich, wenn es Betrag, Termin und Priorität hat. Dann kannst du die Monatsrate berechnen und prüfen, ob sie mit wichtigeren Bedürfnissen konkurriert.

## Ziele nach Zeit aufteilen

Ein kurzfristiges Ziel, etwa Ausrüstung in sechs Monaten, verlangt vor allem eine sichere Aufbewahrung. Ein fernes Ziel kann mehr Schwankung erlauben, braucht aber weiterhin realistische Annahmen und regelmäßige Prüfung.

## Getrennte Umschläge nutzen

Separate Unterkonten oder eine einfache Tabelle helfen, Geld für verschiedene Ziele nicht zu vermischen. Dann wirkt eine Ausgabe für ein Ziel nicht wie unerklärlich verschwundenes Erspartes.

## Merke

- ein konkretes Ziel ist besser als fünf vage;
- berücksichtige Zusatzkosten und steigende Preise;
- feiere Zwischenziele, ohne die Notfallreserve aufzugeben.$$
        ),
        (
            'budgeting-roadmap', 5,
            $$## Plan na miesiąc zaczyna się przed pierwszym wydatkiem

Na początku miesiąca wpisz spodziewane przychody, stałe rachunki, oszczędności i najważniejsze zmienne wydatki. Dzięki temu widzisz, ile naprawdę pozostaje do dyspozycji, zanim pojawią się spontaniczne zakupy.

## Zostaw miejsce na życie

Dobry plan zawiera margines na drobne przyjemności i rzeczy nieprzewidziane. Budżet bez żadnego luzu często kończy się porzuceniem po pierwszym odstępstwie od planu.

## Zamknij miesiąc krótkim przeglądem

Porównaj plan z rzeczywistością: co było za nisko oszacowane, które kategorie nie działały i co warto zmienić następnym razem. Nie chodzi o winę, lecz o lepszą informację dla kolejnego miesiąca.

## Zapamiętaj

- planuj oszczędności jak rachunek do zapłaty;
- sprawdzaj terminy płatności i roczne opłaty;
- małe korekty co miesiąc są skuteczniejsze niż wielki reset raz w roku.$$,
            $$## A monthly plan starts before the first expense

At the start of the month, list expected income, fixed bills, savings and major variable costs. This shows how much is actually available before spontaneous purchases appear.

## Leave room for life

A good plan includes margin for small pleasures and unexpected items. A budget with no flexibility is often abandoned after the first deviation.

## Close the month with a short review

Compare the plan with reality: what was underestimated, which categories did not work and what should change next time. The point is not blame but better information for the next month.

## Remember

- plan savings like a bill to pay;
- check payment dates and annual fees;
- small monthly corrections work better than one big annual reset.$$,
            $$## Ein Monatsplan beginnt vor der ersten Ausgabe

Notiere zu Monatsbeginn erwartete Einnahmen, feste Rechnungen, Sparen und wichtige variable Kosten. So siehst du, wie viel wirklich verfügbar ist, bevor spontane Käufe auftauchen.

## Raum für das Leben lassen

Ein guter Plan enthält Spielraum für kleine Freuden und Unerwartetes. Ein Budget ohne Flexibilität wird nach der ersten Abweichung oft aufgegeben.

## Den Monat kurz auswerten

Vergleiche Plan und Realität: Was war zu niedrig geschätzt, welche Kategorien funktionierten nicht und was änderst du beim nächsten Mal? Es geht nicht um Schuld, sondern um bessere Informationen für den nächsten Monat.

## Merke

- plane Sparen wie eine Rechnung;
- prüfe Zahlungstermine und Jahresgebühren;
- kleine monatliche Korrekturen wirken besser als ein großer Jahresreset.$$
        ),
        (
            'economics-roadmap', 1,
            $$## Gospodarka to sieć decyzji

Gospodarka powstaje z decyzji gospodarstw domowych, firm, państwa i banków. Gospodarstwa pracują, kupują i oszczędzają. Firmy produkują, zatrudniają i inwestują. Państwo pobiera podatki, świadczy usługi publiczne i ustala część reguł gry.

## Pieniądz krąży

Gdy kupujesz produkt, Twoje pieniądze stają się przychodem firmy, która może wypłacić pensje, kupić materiały lub zainwestować. Ten obieg nie jest idealnie równy, ale pomaga zrozumieć, dlaczego jedna decyzja może wpływać na innych uczestników rynku.

## PKB to nie cała historia

Produkt krajowy brutto mierzy wartość wytworzonych dóbr i usług, ale nie opisuje wszystkiego: jakości środowiska, zdrowia, czasu wolnego czy podziału dochodów. Wskaźniki są narzędziami, a nie pełnym obrazem życia.

## Zapamiętaj

- gospodarka łączy wiele uczestników;
- ceny przekazują informacje o popycie i podaży;
- jeden wskaźnik nie wystarcza do oceny całej sytuacji.$$,
            $$## An economy is a network of decisions

An economy is built from decisions by households, companies, government and banks. Households work, buy and save. Companies produce, hire and invest. Government collects taxes, provides public services and sets some of the rules.

## Money circulates

When you buy a product, your money becomes a company’s revenue. It can pay wages, buy materials or fund investment. The cycle is not perfectly even, but it shows why one decision can affect other market participants.

## GDP is not the whole story

Gross domestic product measures the value of goods and services produced, but not everything: environmental quality, health, leisure time or income distribution. Indicators are tools, not a complete picture of life.

## Remember

- an economy connects many participants;
- prices carry information about supply and demand;
- one indicator cannot assess the whole situation.$$,
            $$## Wirtschaft ist ein Netzwerk von Entscheidungen

Eine Wirtschaft entsteht aus Entscheidungen von Haushalten, Unternehmen, Staat und Banken. Haushalte arbeiten, kaufen und sparen. Unternehmen produzieren, stellen ein und investieren. Der Staat erhebt Steuern, erbringt öffentliche Leistungen und setzt einige Regeln.

## Geld zirkuliert

Wenn du ein Produkt kaufst, wird dein Geld zum Umsatz eines Unternehmens. Es kann Löhne zahlen, Material kaufen oder Investitionen finanzieren. Der Kreislauf ist nicht gleichmäßig, zeigt aber, warum eine Entscheidung andere Marktteilnehmer beeinflussen kann.

## Das BIP ist nicht die ganze Geschichte

Das Bruttoinlandsprodukt misst den Wert produzierter Güter und Dienstleistungen, aber nicht alles: Umweltqualität, Gesundheit, Freizeit oder Einkommensverteilung. Indikatoren sind Werkzeuge, kein vollständiges Bild des Lebens.

## Merke

- eine Wirtschaft verbindet viele Beteiligte;
- Preise vermitteln Informationen über Angebot und Nachfrage;
- ein Indikator reicht nicht für die gesamte Bewertung.$$
        ),
        (
            'economics-roadmap', 2,
            $$## Inflacja oznacza zmianę przeciętnego poziomu cen

Inflacja mierzy, jak zmieniają się ceny koszyka dóbr i usług w czasie. Nie oznacza, że każda cena rośnie identycznie: jedne produkty drożeją szybciej, inne mogą tanieć. Dlatego osobiste odczucie inflacji może różnić się od wskaźnika dla całej gospodarki.

## Siła nabywcza

Jeżeli dochód rośnie wolniej niż ceny, za tę samą kwotę można kupić mniej. To właśnie spadek siły nabywczej. Przy planowaniu finansów warto porównywać kwoty nominalne z tym, co realnie można za nie kupić.

## Skąd bierze się presja cenowa?

Ceny mogą rosnąć, gdy popyt przewyższa możliwości produkcji, rosną koszty energii lub transportu albo zmieniają się oczekiwania. Jedna przyczyna rzadko wyjaśnia cały proces.

## Zapamiętaj

- inflacja jest średnią zmianą cen, nie ceną jednego produktu;
- dochód i oszczędności warto oceniać realnie;
- wysokie ceny wymagają przemyślanych decyzji, nie paniki.$$,
            $$## Inflation means a changing average price level

Inflation measures how prices of a basket of goods and services change over time. It does not mean every price rises equally: some products become more expensive faster while others may fall. Personal experience can therefore differ from the economy-wide indicator.

## Purchasing power

If income grows more slowly than prices, the same amount buys less. That is a loss of purchasing power. When planning finances, compare nominal amounts with what they can actually buy.

## Where does price pressure come from?

Prices can rise when demand exceeds production capacity, energy or transport costs increase, or expectations change. One cause rarely explains the whole process.

## Remember

- inflation is an average price change, not the price of one product;
- judge income and savings in real terms;
- high prices call for thoughtful decisions, not panic.$$,
            $$## Inflation bedeutet einen veränderten durchschnittlichen Preisstand

Inflation misst, wie sich die Preise eines Waren- und Dienstleistungskorbs im Zeitverlauf ändern. Sie bedeutet nicht, dass jeder Preis gleich steigt: Manche Produkte verteuern sich schneller, andere können billiger werden. Das persönliche Erleben kann daher vom gesamtwirtschaftlichen Wert abweichen.

## Kaufkraft

Steigt das Einkommen langsamer als die Preise, kann derselbe Betrag weniger kaufen. Das ist ein Verlust an Kaufkraft. Vergleiche bei der Finanzplanung nominale Beträge mit dem, was sie tatsächlich kaufen können.

## Woher kommt Preisdruck?

Preise können steigen, wenn Nachfrage die Produktionskapazität übersteigt, Energie- oder Transportkosten wachsen oder sich Erwartungen ändern. Eine Ursache erklärt selten den ganzen Prozess.

## Merke

- Inflation ist eine durchschnittliche Preisänderung, nicht der Preis eines Produkts;
- beurteile Einkommen und Ersparnisse real;
- hohe Preise verlangen überlegte Entscheidungen statt Panik.$$
        ),
        (
            'economics-roadmap', 3,
            $$## Cena pieniądza

Stopa procentowa jest w uproszczeniu ceną pożyczenia pieniędzy. Wpływa na raty kredytów, oprocentowanie lokat, wycenę obligacji i skłonność firm do inwestowania. Nie istnieje jedna stopa dla wszystkich: inne warunki ma kredyt hipoteczny, inne pożyczka dla firmy, a inne obligacja państwowa.

## Dlaczego decyzje banku centralnego są ważne?

Bank centralny zmienia stopy, aby wpływać na warunki finansowe i inflację. Wyższe stopy mogą ograniczać popyt, bo kredyt jest droższy, ale jednocześnie mogą zwiększać koszt obsługi istniejącego długu.

## Co to oznacza dla gospodarstwa domowego?

Przy zmiennej stopie kredytu rata może się zmieniać. Przy oszczędnościach wyższe oprocentowanie nie zawsze oznacza wyższy realny zysk, jeśli inflacja pozostaje wysoka.

## Zapamiętaj

- sprawdzaj, czy oprocentowanie jest stałe czy zmienne;
- porównuj realny koszt lub realny zysk, nie tylko procent w reklamie;
- decyzje o kredycie wymagają marginesu bezpieczeństwa.$$,
            $$## The price of money

An interest rate is, simply put, the price of borrowing money. It affects loan instalments, deposit rates, bond prices and companies’ willingness to invest. There is no single rate for everyone: a mortgage, a business loan and a government bond have different terms.

## Why central-bank decisions matter

A central bank changes rates to influence financial conditions and inflation. Higher rates can reduce demand because credit costs more, but they can also raise the cost of servicing existing debt.

## What it means for a household

With a variable-rate loan, an instalment can change. For savings, a higher rate does not always mean a higher real gain if inflation stays high.

## Remember

- check whether an interest rate is fixed or variable;
- compare real cost or real return, not only the percentage in an advert;
- borrowing decisions need a safety margin.$$,
            $$## Der Preis des Geldes

Ein Zinssatz ist vereinfacht der Preis dafür, Geld zu leihen. Er beeinflusst Kreditraten, Sparzinsen, Anleihepreise und die Investitionsbereitschaft von Unternehmen. Es gibt keinen einheitlichen Zins für alle: Hypothek, Unternehmenskredit und Staatsanleihe haben unterschiedliche Bedingungen.

## Warum Entscheidungen der Zentralbank wichtig sind

Eine Zentralbank verändert Zinsen, um Finanzbedingungen und Inflation zu beeinflussen. Höhere Zinsen können die Nachfrage dämpfen, weil Kredite teurer werden, erhöhen aber auch die Kosten bestehender Schulden.

## Was das für Haushalte bedeutet

Bei einem variablen Kredit kann sich die Rate ändern. Bei Ersparnissen bedeutet ein höherer Zins nicht immer mehr reale Rendite, wenn die Inflation hoch bleibt.

## Merke

- prüfe, ob ein Zins fest oder variabel ist;
- vergleiche reale Kosten oder reale Rendite, nicht nur Werbeprozente;
- Kreditentscheidungen brauchen einen Sicherheitsabstand.$$
        ),
        (
            'economics-roadmap', 4,
            $$## Gospodarka rzadko porusza się po prostej

Aktywność gospodarcza zwykle przechodzi okresy wzrostu, spowolnienia, osłabienia i ożywienia. Ten cykl nie jest zegarem — jego długość i przebieg zależą od wielu decyzji, wydarzeń i zmian technologicznych.

## Co zmienia się w różnych fazach?

W okresie wzrostu firmy częściej inwestują i zatrudniają, a popyt rośnie. Przy spowolnieniu klienci i firmy mogą ograniczać wydatki, co wpływa na produkcję oraz rynek pracy. Dane publikowane są z opóźnieniem, dlatego fazę cyklu łatwiej rozpoznać po czasie niż przewidzieć z wyprzedzeniem.

## Nie buduj całego planu na prognozie

Prognozy są użyteczne jako scenariusze, ale nie jako pewnik. Gospodarstwo domowe może zwiększać odporność przez rezerwę, rozsądny poziom długu i rozwijanie umiejętności zawodowych.

## Zapamiętaj

- cykl opisuje tendencje, nie gwarantuje dat;
- różne branże reagują w różnym tempie;
- odporność finansowa jest ważniejsza niż trafienie idealnej prognozy.$$,
            $$## The economy rarely moves in a straight line

Economic activity usually passes through periods of growth, slowdown, weakness and recovery. The cycle is not a clock: its length and path depend on many decisions, events and technological changes.

## What changes across phases?

During growth, companies are more likely to invest and hire and demand rises. In a slowdown, customers and firms may reduce spending, affecting production and jobs. Data arrives with a delay, so a phase is easier to identify afterwards than to predict in advance.

## Do not build the whole plan on a forecast

Forecasts are useful as scenarios, not certainties. A household can build resilience through a reserve, sensible debt and developing professional skills.

## Remember

- a cycle describes tendencies, not guaranteed dates;
- industries react at different speeds;
- financial resilience matters more than a perfect forecast.$$,
            $$## Die Wirtschaft bewegt sich selten geradeaus

Wirtschaftliche Aktivität durchläuft meist Phasen von Wachstum, Abschwächung, Schwäche und Erholung. Der Zyklus ist keine Uhr: Dauer und Verlauf hängen von vielen Entscheidungen, Ereignissen und technologischen Veränderungen ab.

## Was verändert sich in den Phasen?

Im Wachstum investieren und stellen Unternehmen häufiger ein, die Nachfrage steigt. In einer Abschwächung können Haushalte und Firmen Ausgaben reduzieren; das wirkt auf Produktion und Arbeitsmarkt. Daten erscheinen verzögert, daher erkennt man eine Phase im Nachhinein leichter als im Voraus.

## Den ganzen Plan nicht auf eine Prognose bauen

Prognosen sind als Szenarien nützlich, nicht als Gewissheit. Ein Haushalt kann durch Reserve, vernünftige Schulden und berufliche Fähigkeiten widerstandsfähiger werden.

## Merke

- ein Zyklus beschreibt Tendenzen, keine garantierten Termine;
- Branchen reagieren unterschiedlich schnell;
- finanzielle Widerstandskraft zählt mehr als eine perfekte Prognose.$$
        ),
        (
            'economics-roadmap', 5,
            $$## Ekonomia pomaga zadawać lepsze pytania

Codzienne decyzje finansowe są związane z gospodarką: wybór kredytu zależy od stóp, oszczędności od inflacji, a stabilność dochodu od rynku pracy. Ekonomia nie podaje jednej właściwej odpowiedzi, ale pomaga dostrzec koszty, alternatywy i skutki uboczne.

## Koszt alternatywny

Każda decyzja oznacza rezygnację z czegoś innego. Pieniądze wydane dziś nie pracują na przyszły cel, a czas poświęcony na jedną rzecz nie może być wykorzystany gdzie indziej. To nie oznacza, że zawsze trzeba wybierać najtańszą opcję — warto jedynie znać cenę wyboru.

## Korzystaj z danych, ale zachowaj kontekst

Wskaźniki, promocje i prognozy są informacją, nie poleceniem. Zadaj pytanie: dla kogo ta liczba jest ważna, z czym ją porównuję i czy pasuje do mojej sytuacji?

## Zapamiętaj

- dobre decyzje uwzględniają alternatywy;
- realna wartość pieniędzy zależy od cen i czasu;
- małe, świadome wybory budują większą odporność finansową.$$,
            $$## Economics helps you ask better questions

Everyday financial decisions connect to the economy: a loan choice depends on rates, savings on inflation and income stability on the labour market. Economics does not provide one correct answer, but it helps reveal costs, alternatives and side effects.

## Opportunity cost

Every decision means giving up something else. Money spent today does not work toward a future goal, and time spent on one thing cannot be used elsewhere. This does not mean always choosing the cheapest option — it means knowing the cost of the choice.

## Use data, but keep context

Indicators, promotions and forecasts are information, not instructions. Ask: for whom is this number important, what am I comparing it with and does it fit my situation?

## Remember

- good decisions consider alternatives;
- money’s real value depends on prices and time;
- small conscious choices build greater financial resilience.$$,
            $$## Wirtschaft hilft, bessere Fragen zu stellen

Alltägliche Finanzentscheidungen hängen mit der Wirtschaft zusammen: Die Kreditwahl hängt von Zinsen ab, Ersparnisse von Inflation und Einkommenssicherheit vom Arbeitsmarkt. Wirtschaft liefert nicht eine richtige Antwort, zeigt aber Kosten, Alternativen und Nebenwirkungen.

## Opportunitätskosten

Jede Entscheidung bedeutet, auf etwas anderes zu verzichten. Geld, das heute ausgegeben wird, arbeitet nicht für ein künftiges Ziel, und Zeit für eine Sache fehlt an anderer Stelle. Das heißt nicht, immer das Billigste zu wählen — es heißt, den Preis der Wahl zu kennen.

## Daten nutzen, aber Kontext behalten

Indikatoren, Angebote und Prognosen sind Informationen, keine Anweisungen. Frage: Für wen ist diese Zahl wichtig, womit vergleiche ich sie und passt sie zu meiner Situation?

## Merke

- gute Entscheidungen berücksichtigen Alternativen;
- der reale Wert des Geldes hängt von Preisen und Zeit ab;
- kleine bewusste Entscheidungen schaffen mehr finanzielle Widerstandskraft.$$
        )
),
lesson_materials AS (
    SELECT
        l.id AS lesson_id,
        l.title,
        l.description,
        l.translations -> 'en' ->> 'title' AS title_en,
        l.translations -> 'en' ->> 'description' AS description_en,
        l.translations -> 'de' ->> 'title' AS title_de,
        l.translations -> 'de' ->> 'description' AS description_de,
        template.article_pl,
        template.article_en,
        template.article_de
    FROM lesson_material_templates template
    JOIN courses c ON c.slug = template.course_slug
    JOIN lessons l ON l.course_id = c.id AND l.order_index = template.order_index
),
activity_templates AS (
    SELECT
        lesson_id,
        format('Przeczytaj: %s', title) AS title,
        'article' AS activity_type,
        1 AS order_index,
        15 AS xp_reward,
        5 AS coin_reward,
        7 AS estimated_minutes,
        jsonb_build_object('markdown', article_pl, 'reading_time_minutes', 7) AS content,
        jsonb_build_object(
            'en', jsonb_build_object(
                'title', format('Read: %s', title_en),
                'content', jsonb_build_object('markdown', article_en, 'reading_time_minutes', 7)
            ),
            'de', jsonb_build_object(
                'title', format('Lesen: %s', title_de),
                'content', jsonb_build_object('markdown', article_de, 'reading_time_minutes', 7)
            )
        ) AS translations
    FROM lesson_materials

    UNION ALL

    SELECT
        lesson_id,
        format('Quiz: %s', title),
        'quiz',
        2,
        25,
        10,
        5,
        jsonb_build_object(
            'passing_score_percentage', 67,
            'questions', jsonb_build_array(
                jsonb_build_object(
                    'id', 'q1',
                    'prompt', format('Jaki jest główny cel lekcji „%s”?', title),
                    'options', jsonb_build_array(
                        jsonb_build_object('id', 'a', 'text', description),
                        jsonb_build_object('id', 'b', 'text', 'Podejmowanie decyzji bez sprawdzania informacji'),
                        jsonb_build_object('id', 'c', 'text', 'Szukanie gwarantowanego, szybkiego zysku')
                    ),
                    'correct_option_id', 'a',
                    'explanation', 'Cel lekcji wynika z jej opisu; dobra decyzja wymaga dopasowania wiedzy do własnej sytuacji.'
                ),
                jsonb_build_object(
                    'id', 'q2',
                    'prompt', 'Która praktyka najlepiej wspiera świadomą decyzję finansową?',
                    'options', jsonb_build_array(
                        jsonb_build_object('id', 'a', 'text', 'Sprawdzenie celu, terminu i ryzyka'),
                        jsonb_build_object('id', 'b', 'text', 'Naśladowanie przypadkowej porady z internetu'),
                        jsonb_build_object('id', 'c', 'text', 'Zmiana planu po każdym nagłówku')
                    ),
                    'correct_option_id', 'a',
                    'explanation', 'Cel, horyzont i ryzyko pomagają ocenić, czy dane rozwiązanie pasuje do Twojej sytuacji.'
                ),
                jsonb_build_object(
                    'id', 'q3',
                    'prompt', 'Co warto zrobić po poznaniu nowego pojęcia finansowego?',
                    'options', jsonb_build_array(
                        jsonb_build_object('id', 'a', 'text', 'Od razu przeznaczyć na nie wszystkie oszczędności'),
                        jsonb_build_object('id', 'b', 'text', 'Porównać je z celem, kosztami i możliwymi ryzykami'),
                        jsonb_build_object('id', 'c', 'text', 'Założyć, że przeszłe wyniki gwarantują przyszłe')
                    ),
                    'correct_option_id', 'b',
                    'explanation', 'Nową wiedzę warto sprawdzić w kontekście własnego celu, kosztów i ryzyka.'
                )
            )
        ),
        jsonb_build_object(
            'en', jsonb_build_object(
                'title', format('Quiz: %s', title_en),
                'content', jsonb_build_object(
                    'questions', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'q1',
                            'prompt', format('What is the main goal of the lesson "%s"?', title_en),
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', description_en),
                                jsonb_build_object('id', 'b', 'text', 'Make decisions without checking information'),
                                jsonb_build_object('id', 'c', 'text', 'Look for a guaranteed quick return')
                            ),
                            'explanation', 'The lesson goal follows from its description; a good decision fits knowledge to your situation.'
                        ),
                        jsonb_build_object(
                            'id', 'q2',
                            'prompt', 'Which practice best supports an informed financial decision?',
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', 'Check the goal, time horizon and risk'),
                                jsonb_build_object('id', 'b', 'text', 'Copy a random online tip'),
                                jsonb_build_object('id', 'c', 'text', 'Change the plan after every headline')
                            ),
                            'explanation', 'A goal, horizon and risk help determine whether a solution fits your situation.'
                        ),
                        jsonb_build_object(
                            'id', 'q3',
                            'prompt', 'What should you do after learning a new financial concept?',
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', 'Put all savings into it immediately'),
                                jsonb_build_object('id', 'b', 'text', 'Compare it with your goal, costs and possible risks'),
                                jsonb_build_object('id', 'c', 'text', 'Assume past results guarantee future results')
                            ),
                            'explanation', 'Check new knowledge against your own goal, costs and risks.'
                        )
                    )
                )
            ),
            'de', jsonb_build_object(
                'title', format('Quiz: %s', title_de),
                'content', jsonb_build_object(
                    'questions', jsonb_build_array(
                        jsonb_build_object(
                            'id', 'q1',
                            'prompt', format('Was ist das Hauptziel der Lektion „%s“?', title_de),
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', description_de),
                                jsonb_build_object('id', 'b', 'text', 'Entscheidungen treffen, ohne Informationen zu prüfen'),
                                jsonb_build_object('id', 'c', 'text', 'Nach einem garantierten schnellen Gewinn suchen')
                            ),
                            'explanation', 'Das Ziel folgt aus der Beschreibung; eine gute Entscheidung passt Wissen zur eigenen Situation an.'
                        ),
                        jsonb_build_object(
                            'id', 'q2',
                            'prompt', 'Welche Praxis unterstützt eine bewusste Finanzentscheidung am besten?',
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', 'Ziel, Zeithorizont und Risiko prüfen'),
                                jsonb_build_object('id', 'b', 'text', 'Einen zufälligen Internettipp kopieren'),
                                jsonb_build_object('id', 'c', 'text', 'Den Plan nach jeder Schlagzeile ändern')
                            ),
                            'explanation', 'Ziel, Horizont und Risiko helfen zu beurteilen, ob eine Lösung zu deiner Situation passt.'
                        ),
                        jsonb_build_object(
                            'id', 'q3',
                            'prompt', 'Was solltest du nach einem neuen Finanzbegriff tun?',
                            'options', jsonb_build_array(
                                jsonb_build_object('id', 'a', 'text', 'Sofort alle Ersparnisse dafür einsetzen'),
                                jsonb_build_object('id', 'b', 'text', 'Ihn mit Ziel, Kosten und möglichen Risiken vergleichen'),
                                jsonb_build_object('id', 'c', 'text', 'Annehmen, dass vergangene Ergebnisse zukünftige garantieren')
                            ),
                            'explanation', 'Prüfe neues Wissen anhand deines Ziels, der Kosten und Risiken.'
                        )
                    )
                )
            )
        )
    FROM lesson_materials

    UNION ALL

    SELECT
        lesson_id,
        format('Film: %s', title),
        'video',
        3,
        15,
        5,
        3,
        jsonb_build_object(
            'duration_seconds', 180,
            'description', format('Film utrwala lekcję „%s”. Zwróć uwagę na jej główną ideę: %s', title, description)
        ),
        jsonb_build_object(
            'en', jsonb_build_object(
                'title', format('Video: %s', title_en),
                'content', jsonb_build_object(
                    'duration_seconds', 180,
                    'description', format('This video reinforces "%s". Focus on its key idea: %s', title_en, description_en)
                )
            ),
            'de', jsonb_build_object(
                'title', format('Video: %s', title_de),
                'content', jsonb_build_object(
                    'duration_seconds', 180,
                    'description', format('Dieses Video vertieft „%s“. Achte auf die Kernidee: %s', title_de, description_de)
                )
            )
        )
    FROM lesson_materials
)
INSERT INTO activities (
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
)
SELECT
    lesson_id, title, activity_type, order_index, xp_reward, coin_reward,
    estimated_minutes, content, translations
FROM activity_templates
ORDER BY lesson_id, order_index;

DO $$
BEGIN
    IF (SELECT count(*) FROM courses) <> 4 THEN
        RAISE EXCEPTION 'Expected 4 mock courses';
    END IF;
    IF (SELECT count(*) FROM lessons) <> 20 THEN
        RAISE EXCEPTION 'Expected 20 mock lessons';
    END IF;
    IF (SELECT count(*) FROM activities) <> 60 THEN
        RAISE EXCEPTION 'Expected 60 mock activities';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM courses c
        LEFT JOIN lessons l ON l.course_id = c.id
        GROUP BY c.id
        HAVING count(l.id) <> 5
    ) THEN
        RAISE EXCEPTION 'Expected 5 lessons in every mock course';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM lessons l
        LEFT JOIN activities a ON a.lesson_id = l.id
        GROUP BY l.id
        HAVING count(a.id) <> 3
    ) THEN
        RAISE EXCEPTION 'Expected 3 activities in every mock lesson';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM activities
        WHERE activity_type = 'quiz'
          AND jsonb_array_length(content -> 'questions') <> 3
    ) THEN
        RAISE EXCEPTION 'Expected 3 questions in every mock quiz';
    END IF;
END $$;

COMMIT;
