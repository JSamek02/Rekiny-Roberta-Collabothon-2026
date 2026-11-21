"""
backend/services/simulation_data.py
Zweryfikowane historyczne dane kwartalne od 2007 do 2022 roku
dla S&P 500, Obligacji 10-letnich, Złota, Gotówki oraz Wskaźnika Inflacji (CPI).

Źródła:
- S&P 500 Total Return: Yahoo Finance / S&P Dow Jones Indices
- 10-Year Treasury: FRED (Federal Reserve Bank of St. Louis)
- Złoto: LBMA (London Bullion Market Association) / GLD
- Gotówka: FRED 3-Month T-Bill (TB3MS)
- Inflacja: U.S. Bureau of Labor Statistics (CPIAUCSL)
"""

from typing import Any, Dict, List

DATA_SOURCES_METADATA = {
    "stocks": "S&P 500 Total Return Index (z reinwestycją dywidend) via Yahoo Finance / Stooq",
    "bonds": "10-Year U.S. Treasury Total Return Index via FRED (Federal Reserve Economic Data)",
    "gold": "Cena uncji złota spot w USD via LBMA / World Gold Council",
    "cash": "Stopa 3-Month Treasury Bill via FRED",
    "inflation": "U.S. Consumer Price Index (CPIAUCSL) via Bureau of Labor Statistics / FRED",
}

# 3 Chronologiczne Wydarzenia Historyczne
SIMULATION_EVENTS: List[Dict[str, Any]] = [
    {
        "id": "gfc_2008",
        "order_index": 1,
        "title": "Wielki Kryzys Finansowy i Upadek Lehman Brothers (2007–2011)",
        "period": "2007-Q4 – 2011-Q4",
        "total_quarters": 17,
        "starting_capital": 10000.0,
        "initial_context": {
            "headline": "Jesień 2007: Pozorny spokój przed burzą stulecia",
            "description": (
                "Jest IV kwartał 2007 roku. Światowa gospodarka od lat rozwija się stabilnie, "
                "a rynki akcji osiągają historyczne szczyty. Masz 10 000 zł w gotówce i zero inwestycji. "
                "W mediach pojawiają się pierwsze niepokojące sygnały o 'złych kredytach hipotecznych subprime' w USA, "
                "ale większość analityków bagatelizuje problem. Zdecyduj, w co ulokujesz swój kapitał!"
            ),
            "key_learning_question": "Czy lepiej wejść na rynek akcji, zabezpieczyć się obligacjami i złotem, czy trzymać gotówkę?",
        },
        "quarters": [
            {
                "quarter": "2007-Q4",
                "returns": {"stocks": -0.038, "bonds": 0.041, "gold": 0.123, "cash": 0.011},
                "cpi": 0.012,
                "headline": "Pierwsze pęknięcia: Bankructwa mniejszych funduszy hipotecznych",
                "context": "Rynki akcji lekko korygują (-3.8%), ale złoto zyskuje +12.3%, a bezpieczne obligacje skarbowe rosną.",
                "lesson": "Złoto i obligacje natychmiast reagują na pierwsze sygnały niepewności w sektorze bankowym.",
            },
            {
                "quarter": "2008-Q1",
                "returns": {"stocks": -0.099, "bonds": 0.039, "gold": 0.102, "cash": 0.007},
                "cpi": 0.010,
                "headline": "Marzec 2008: Upadek i przymusowe przejęcie Bear Stearns",
                "context": "Piąty co do wielkości bank inwestycyjny na Wall Street staje na krawędzi bankructwa i zostaje przejęty przez JPMorgan przy wsparciu rządu.",
                "lesson": "Ryzyko w sektorze finansowym rozlewa się szerzej, akcje pogłębiają spadki, a kapitał ucieka do bezpiecznych obligacji.",
            },
            {
                "quarter": "2008-Q2",
                "returns": {"stocks": -0.032, "bonds": -0.018, "gold": -0.004, "cash": 0.005},
                "cpi": 0.020,
                "headline": "Chwilowa stabilizacja i narastająca presja inflacyjna",
                "context": "Ceny ropy naftowej biją historyczny rekord ($140 za baryłkę), podbijając inflację, podczas gdy gospodarka gwałtownie zwalnia.",
                "lesson": "Zjawisko stagflacji (wysoka inflacja + spowolnienie gospodarcze) utrudnia bankom centralnym szybkie ratowanie rynków.",
            },
            {
                "quarter": "2008-Q3",
                "returns": {"stocks": -0.089, "bonds": 0.022, "gold": -0.057, "cash": 0.004},
                "cpi": -0.008,
                "headline": "Wrzesień 2008: Upadek Lehman Brothers i szok płynnościowy",
                "context": "15 września 2008 roku 158-letni Lehman Brothers ogłasza upadłość. Banki na całym świecie przestają sobie ufać. Akcje lecą w dół.",
                "lesson": "Brak poduszki płynnościowej i paniczna sprzedaż w tym momencie to najczęstszy błąd początkujących.",
            },
            {
                "quarter": "2008-Q4",
                "returns": {"stocks": -0.219, "bonds": 0.148, "gold": 0.013, "cash": 0.001},
                "cpi": -0.039,
                "headline": "Apogeum Paniki: Najgorszy kwartał dla akcji od lat 30.",
                "context": "Akcje tracą aż -21.9% w zaledwie 3 miesiące. Obligacje skarbowe USA wystrzeliwują w górę o rekordowe +14.8% jako jedyna bezpieczna przystań.",
                "lesson": "Ten kwartał udowodnił potęgę obligacji rządowych – inwestorzy z 40% w obligacjach ograniczyli stratę z -22% do zaledwie -7%.",
            },
            {
                "quarter": "2009-Q1",
                "returns": {"stocks": -0.117, "bonds": -0.024, "gold": 0.043, "cash": 0.001},
                "cpi": 0.009,
                "headline": "9 Marca 2009: Historyczne dno kryzysu i skrajny pesymizm",
                "context": "Indeks S&P 500 osiąga dno na poziomie 666 punktów. W mediach dominują nagłówki o końcu kapitalizmu. Właśnie wtedy zaczyna się największa hossa w historii.",
                "lesson": "Kupowanie lub trzymanie aktywów, gdy wszyscy wokół panikują (zasada Warrena Buffetta: 'Bądź chciwy, gdy inni się boją'), przynosi najwyższe długoterminowe zyski.",
            },
            {
                "quarter": "2009-Q2",
                "returns": {"stocks": 0.159, "bonds": -0.041, "gold": 0.010, "cash": 0.001},
                "cpi": 0.014,
                "headline": "Start pakietów ratunkowych i eksplozja odbicia (+15.9%)",
                "context": "Rządy uruchamiają pakiety TARP, a Fed rozpoczyna bezprecedensowy dodruk (Quantitative Easing). Giełdy gwałtownie odbijają.",
                "lesson": "Kto sprzedał wszystko w marcu 2009 do gotówki, bezpowrotnie stracił ten ogromny rajd wzrostowy.",
            },
            {
                "quarter": "2009-Q3",
                "returns": {"stocks": 0.156, "bonds": 0.023, "gold": 0.085, "cash": 0.001},
                "cpi": 0.001,
                "headline": "Kontynuacja hossy i wzrosty złota (+8.5%)",
                "context": "Gospodarka powoli staje na nogi, a inwestorzy odzyskują zaufanie do spółek technologicznych i przemysłowych.",
                "lesson": "Dywersyfikacja pozwala korzystać zarówno ze wzrostu akcji, jak i surowców.",
            },
            {
                "quarter": "2009-Q4",
                "returns": {"stocks": 0.060, "bonds": -0.028, "gold": 0.093, "cash": 0.001},
                "cpi": 0.000,
                "headline": "Powrót zaufania i zakończenie roku zyskiem",
                "context": "Rok 2009 kończy się spektakularnym odbiciem akcji o ponad 26% w skali całego roku, mimo że zaczynał się od paniki.",
                "lesson": "Cierpliwość i dyscyplina w inwestowaniu są ważniejsze niż próby przewidywania dołków.",
            },
            {
                "quarter": "2010-Q1",
                "returns": {"stocks": 0.054, "bonds": 0.011, "gold": 0.017, "cash": 0.001},
                "cpi": 0.008,
                "headline": "Stabilny początek nowego dziesięciolecia",
                "context": "Spółki raportują poprawiające się wyniki finansowe. Odbicie gospodarcze nabiera realnych kształtów.",
                "lesson": "Gospodarka stopniowo dostosowuje się do nowych warunków.",
            },
            {
                "quarter": "2010-Q2",
                "returns": {"stocks": -0.114, "bonds": 0.048, "gold": 0.117, "cash": 0.001},
                "cpi": -0.001,
                "headline": "Maj 2010: Flash Crash i kryzys zadłużeniowy w Grecji",
                "context": "Błyskawiczne załamanie algorytmiczne (Flash Crash) oraz obawy o bankructwo Grecji wywołują gwałtowną korektę. Złoto rośnie o +11.7%.",
                "lesson": "Korekty o 10-15% są normalną częścią każdej hossy rynkowej i nie muszą oznaczać powrotu do kryzysu.",
            },
            {
                "quarter": "2010-Q3",
                "returns": {"stocks": 0.113, "bonds": 0.032, "gold": 0.048, "cash": 0.001},
                "cpi": 0.004,
                "headline": "Zapowiedź QE2 przez Rezerwę Federalną",
                "context": "Banki centralne gwarantują utrzymanie niskich stóp procentowych, co pobudza inwestycje w akcje i surowce.",
                "lesson": "Działania polityki monetarnej mają bezpośrednie przełożenie na ceny aktywów.",
            },
            {
                "quarter": "2010-Q4",
                "returns": {"stocks": 0.108, "bonds": -0.038, "gold": 0.078, "cash": 0.001},
                "cpi": 0.004,
                "headline": "Silna końcówka roku na rynkach światowych",
                "context": "Zyski przedsiębiorstw osiągają poziomy sprzed kryzysu z 2008 roku.",
                "lesson": "Inwestowanie w globalną gospodarkę polega na wierze w zdolność firm do innowacji i adaptacji.",
            },
            {
                "quarter": "2011-Q1",
                "returns": {"stocks": 0.059, "bonds": -0.001, "gold": 0.013, "cash": 0.001},
                "cpi": 0.018,
                "headline": "Trzęsienie ziemi w Fukushimie i Arabski Wiosenny Niepokój",
                "context": "Mimo wstrząsów geopolitycznych rynki zachowują stabilność, wspierane rosnącą produkcją przemysłową.",
                "lesson": "Pojedyncze wydarzenia losowe rzadko niszczą długoterminowy trend rynkowy.",
            },
            {
                "quarter": "2011-Q2",
                "returns": {"stocks": 0.001, "bonds": 0.027, "gold": 0.043, "cash": 0.001},
                "cpi": 0.010,
                "headline": "Ochłodzenie koniunktury i eskalacja kryzysu w strefie euro",
                "context": "Inwestorzy bacznie obserwują rosnące rentowności obligacji Włoch i Hiszpanii.",
                "lesson": "Zmienność jest ceną, którą płaci się za wyższą długoterminową stopę zwrotu.",
            },
            {
                "quarter": "2011-Q3",
                "returns": {"stocks": -0.139, "bonds": 0.129, "gold": 0.082, "cash": 0.001},
                "cpi": 0.008,
                "headline": "Sierpień 2011: Obniżenie ratingu wiarygodności USA przez S&P",
                "context": "Po raz pierwszy w historii agencja S&P obniża rating kredytowy USA z AAA do AA+. Akcje tracą -13.9%, a obligacje i złoto znowu ratują portfel (+12.9%).",
                "lesson": "Kolejny dowód na ujemną korelację akcji i obligacji w momentach paniki.",
            },
            {
                "quarter": "2011-Q4",
                "returns": {"stocks": 0.118, "bonds": 0.009, "gold": -0.034, "cash": 0.001},
                "cpi": -0.006,
                "headline": "Koniec czteroletniej próby ognia: Rynek wychodzi obronną ręką",
                "context": "Europejski Bank Centralny interweniuje, rynki zamykają 2011 rok mocnym rajdem, potwierdzając koniec kryzysowego cyklu.",
                "lesson": "Przetrwałeś najgorszy kryzys od Wielkiego Kryzysu z 1929 roku. Zobacz podsumowanie swoich decyzji!",
            },
        ],
    },
    {
        "id": "covid_2020",
        "order_index": 2,
        "title": "Krach COVID-19 i Szok Płynnościowy (2020–2021)",
        "period": "2020-Q1 – 2021-Q4",
        "total_quarters": 8,
        "starting_capital": 10000.0,
        "initial_context": {
            "headline": "Styczeń 2020: Rekordy wycen i pierwsze doniesienia z Wuhan",
            "description": (
                "Jest styczeń 2020 roku. Rynki finansowe pną się w górę, a spółki technologiczne biją rekordy. "
                "Pojawiają się pierwsze wieści o nowym wirusie w Chinach. "
                "Zaczynasz ten etap z 10 000 zł w czystej gotówce. Wybierz, jak podzielisz kapitał na starcie!"
            ),
            "key_learning_question": "Jak przygotować portfel na niespodziewany czarny łabędź?",
        },
        "quarters": [
            {
                "quarter": "2020-Q1",
                "returns": {"stocks": -0.196, "bonds": 0.082, "gold": 0.039, "cash": 0.003},
                "cpi": 0.003,
                "headline": "Marzec 2020: Globalny Lockdown i Błyskawiczny Krach (-19.6%)",
                "context": "Światowa Organizacja Zdrowia ogłasza pandemię. Rynki notują najszybszy 30-procentowy zjazd w historii nowożytnej. Obligacje zyskują +8.2%, a złoto +3.9%.",
                "lesson": "Szok płynnościowy: w panice inwestorzy wyprzedają wszystko, ale jakość i dywersyfikacja szybko chronią kapitał.",
            },
            {
                "quarter": "2020-Q2",
                "returns": {"stocks": 0.205, "bonds": 0.003, "gold": 0.128, "cash": 0.001},
                "cpi": -0.002,
                "headline": "Biliony z banków centralnych i eksplozja pracy zdalnej (+20.5%)",
                "context": "Stopy procentowe spadają do 0%, rządy wysyłają czeki pomocowe, a sektor technologiczny (Zoom, Amazon, Microsoft) bije rekordy przychodów.",
                "lesson": "Sprzedaż na dnie w marcu zamknęła drogę do tego spektakularnego odbicia.",
            },
            {
                "quarter": "2020-Q3",
                "returns": {"stocks": 0.089, "bonds": 0.002, "gold": 0.059, "cash": 0.000},
                "cpi": 0.012,
                "headline": "Stopniowe odmrażanie gospodarki i letnia hossa",
                "context": "Fabryki wznawiają produkcję, zaufanie konsumentów wraca, a złoto bije historyczny rekord przekraczając 2000 USD/oz.",
                "lesson": "Rynki giełdowe wyprzedzają realną gospodarkę o 6-12 miesięcy.",
            },
            {
                "quarter": "2020-Q4",
                "returns": {"stocks": 0.121, "bonds": -0.016, "gold": 0.006, "cash": 0.000},
                "cpi": 0.004,
                "headline": "Listopad 2020: Sukces Szczepionki mRNA Pfizera i BioNTech",
                "context": "Ogłoszenie ponad 90-procentowej skuteczności szczepionki wywołuje euforię. Rozpoczyna się rajd tradycyjnych gałęzi gospodarki.",
                "lesson": "Przełom technologiczny i naukowy potrafi całkowicie odwrócić nastroje rynkowe w ciągu kilku godzin.",
            },
            {
                "quarter": "2021-Q1",
                "returns": {"stocks": 0.062, "bonds": -0.057, "gold": -0.100, "cash": 0.000},
                "cpi": 0.017,
                "headline": "Rotacja w stronę tradycyjnej gospodarki i skok rentowności",
                "context": "Masowe szczepienia ruszają na całym świecie. Oczekiwania silnego wzrostu gospodarczego uderzają w obligacje długoterminowe (-5.7%).",
                "lesson": "Gdy rynki oczekują boomu gospodarczego, ceny obligacji o stałym oprocentowaniu mogą spadać.",
            },
            {
                "quarter": "2021-Q2",
                "returns": {"stocks": 0.085, "bonds": 0.017, "gold": 0.037, "cash": 0.000},
                "cpi": 0.023,
                "headline": "Pierwsze symptomy powracającej inflacji (+2.3% w kwartale)",
                "context": "Pozrywane łańcuchy dostaw, brak mikroprocesorów i ogromny popyt konsumpcyjny podbijają ceny surowców i towarów.",
                "lesson": "Akcje spółek o silnej pozycji rynkowej (pricing power) potrafią przerzucać rosnące koszty na klientów.",
            },
            {
                "quarter": "2021-Q3",
                "returns": {"stocks": 0.006, "bonds": 0.001, "gold": -0.007, "cash": 0.000},
                "cpi": 0.014,
                "headline": "Letnie wyczekiwanie i debata o 'przejściowej inflacji'",
                "context": "Banki centralne utrzymują narrację, że inflacja jest zjawiskiem tymczasowym, rynki poruszają się w trendzie bocznym.",
                "lesson": "W inwestowaniu okresy uspokojenia są idealnym momentem na weryfikację struktury portfela.",
            },
            {
                "quarter": "2021-Q4",
                "returns": {"stocks": 0.110, "bonds": 0.000, "gold": 0.041, "cash": 0.000},
                "cpi": 0.018,
                "headline": "Finał pandemicznej hossy: S&P 500 kończy rok blisko szczytu",
                "context": "Mimo narastających wątpliwości inflacyjnych, rok 2021 kończy się imponującym zyskiem całego rynku akcji.",
                "lesson": "Dwa lata po wybuchu największej pandemii stulecia zdywersyfikowany inwestor wypracował ponad 30-procentowy zysk.",
            },
        ],
    },
    {
        "id": "inflation_2022",
        "order_index": 3,
        "title": "Szok Inflacyjny i Podwyżki Stóp Procentowych (2022)",
        "period": "2022-Q1 – 2022-Q4",
        "total_quarters": 4,
        "starting_capital": 10000.0,
        "initial_context": {
            "headline": "Styczeń 2022: Najwyższa inflacja od 40 lat i widmo wojny",
            "description": (
                "Jest styczeń 2022 roku. Ceny w sklepach rosną w oczach, a banki centralne zapowiadają koniec ery darmowego pieniądza. "
                "Zaczynasz z 10 000 zł w gotówce. "
                "Twoim celem jest obrona realnej siły nabywczej w jednym z najtrudniejszych lat dla rynków!"
            ),
            "key_learning_question": "Jak chronić kapitał, gdy spadają i akcje, i obligacje?",
        },
        "quarters": [
            {
                "quarter": "2022-Q1",
                "returns": {"stocks": -0.046, "bonds": -0.064, "gold": 0.059, "cash": 0.001},
                "cpi": 0.023,
                "headline": "Luty 2022: Inwazja Rosji na Ukrainę i szok surowcowy",
                "context": "Wojna w Europie wywołuje gwałtowny skok cen ropy, gazu i pszenicy. Złoto zyskuje +5.9%, podczas gdy akcje i obligacje nurkują.",
                "lesson": "Złoto po raz kolejny potwierdza rolę bezpiecznej przystani w momentach kryzysów geopolitycznych.",
            },
            {
                "quarter": "2022-Q2",
                "returns": {"stocks": -0.161, "bonds": -0.051, "gold": -0.067, "cash": 0.003},
                "cpi": 0.030,
                "headline": "Agresywne podwyżki stóp przez Fed (+75 bps) i krach 60/40",
                "context": "Inflacja w USA przekracza 9%, w Polsce bije 15%. Banki centralne gwałtownie podnoszą stopy. Rzadkie zjawisko: akcje tracą -16.1%, a obligacje -5.1%.",
                "lesson": "Gwałtowny wzrost stóp procentowych uderza w wyceny starszych obligacji o niskim kuponie (tzw. ryzyko stopy procentowej).",
            },
            {
                "quarter": "2022-Q3",
                "returns": {"stocks": -0.049, "bonds": -0.044, "gold": -0.081, "cash": 0.007},
                "cpi": 0.008,
                "headline": "Szczyt pesymizmu i mocny dolar wysysający płynność",
                "context": "Dolar amerykański bije wieloletnie rekordy siły, drenując kapitał z rynków wschodzących i surowców.",
                "lesson": "W okresach zacieśniania monetarnego wysoka płynność i gotówka dają komfort psychiczny i okazję do późniejszych zakupów.",
            },
            {
                "quarter": "2022-Q4",
                "returns": {"stocks": 0.076, "bonds": 0.007, "gold": 0.098, "cash": 0.010},
                "cpi": 0.008,
                "headline": "Inflacja zaczyna hamować, złoto wystrzeliwuje w górę (+9.8%)",
                "context": "Pierwsze odczyty pokazują spadek dynamiki inflacji. Rynki witają to z ulgą, a premia za ryzyko zaczyna powracać.",
                "lesson": "Najtrudniejszy rok od dekad dobiegł końca. Sprawdź, czy Twój portfel obronił realną wartość!",
            },
        ],
    },
]


def get_event_by_id(event_id: str) -> Dict[str, Any] | None:
    for ev in SIMULATION_EVENTS:
        if ev["id"] == event_id:
            return ev
    return None
