# ForgePro Launch Plan

## Pozycjonowanie
ForgePro v1 to prosty tracker treningów z importem planów, historią progresu i warstwą premium dla synchronizacji, AI i zaawansowanej analityki.

## Etap 1: Core Loop
- Ustabilizować `live workout`: start, logowanie serii, edycja, usuwanie, odpoczynek, zakończenie.
- Naprawić wszystkie puste stany i niespójności wizualne w logowaniu serii.
- Uprościć flow treningu tak, żeby użytkownik mógł wszystko obsłużyć jedną ręką.
- Ujednolicić ekran `home`, `workouts`, `progress` i `live workout`.

## Etap 2: Fundament Kodowy
- Rozbić `public/index.html` na osobne pliki CSS i JS.
- Wydzielić moduły: `state`, `workout`, `progress`, `import`, `ai`, `ui`.
- Usunąć zależność od ogromnej liczby inline style.
- Przygotować prostą strukturę migracji danych.

## Etap 3: Dane i Zaufanie
- Dodać konto użytkownika.
- Dodać synchronizację danych treningowych.
- Zapewnić backup i eksport danych.
- Dodać ochronę przed utratą danych po zmianie urządzenia.

## Etap 4: Premium
- Dodać płatności przez Stripe.
- Zdefiniować plan Free i Premium.
- Free:
- logowanie treningów
- historia
- podstawowy progres
- podstawowa waga
- Premium:
- sync w chmurze
- import planów z PDF i zdjęcia
- AI coach
- zaawansowane statystyki
- eksport danych

## Etap 5: Import i AI
- Dopracować import PDF, Excel i zdjęć.
- Dodać ekran korekty po imporcie.
- Ograniczyć AI do miejsc, gdzie realnie pomaga:
- analiza po treningu
- sugestia progresji
- analiza trendu wagi i objętości

## Etap 6: Beta i Launch
- Zamknięta beta 10-30 użytkowników.
- Zbieranie feedbacku tylko o najważniejszych flow.
- Poprawki stabilności.
- Dopiero potem publiczny launch.

## Najbliższa kolejność prac
1. Dokończyć porządek w strukturze frontendu.
2. Ustabilizować `live workout`.
3. Dopić design system.
4. Dodać logowanie i sync.
5. Dodać premium i płatności.
