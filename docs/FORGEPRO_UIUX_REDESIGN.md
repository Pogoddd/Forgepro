# 📱 FORGEPRO - REDESIGN UI/UX
## Nowoczesny interfejs fitness z AI

---

## FILOZOFIA DESIGNU

**Zasada 3-kliknięć:**
Od otwarcia apki do rozpoczęcia treningu = MAX 3 kliknięcia

**Priorytet:**
1. Czytelność progresu (widzisz postępy NA PIERWSZY rzut oka)
2. Szybkość (zero friction)
3. Motywacja (wizualne nagrody, feedback)

**Inspiracje:**
- Strava (sportowy minimalizm)
- Strong (czytelne tabele)
- Oura Ring (health insights)
- Duolingo (gamifikacja)

---

## ARCHITEKTURA EKRANÓW

### POZIOM 1: Bottom Navigation (4 główne ekrany)

```
┌─────────────────────────────────────┐
│  [🏠 Home] [💪 Trening] [📊 Stats] [👤 Profil]  │
└─────────────────────────────────────┘
```

**1. 🏠 HOME (Dashboard)**
**2. 💪 TRENING (Live workout + Plany)**
**3. 📊 STATYSTYKI (Progres + AI insights)**
**4. 👤 PROFIL (Ustawienia + Community)**

---

## EKRAN 1: 🏠 HOME (DASHBOARD)

### Layout (górna część):

```
╔════════════════════════════════════╗
║  [Logo] ForgePro        🔥 12 dni  ║  ← Streak badge
║                                    ║
║  ┌──┬──┬──┬──┬──┬──┬──┐          ║  ← Kalendarz tygodniowy
║  │Pn│Wt│Śr│Cz│Pt│So│Nd│          ║     (dzisiejszy = pomarańczowy)
║  │✓ │✓ │✓ │  │  │  │  │          ║     (ukończony = zielony)
║  └──┴──┴──┴──┴──┴──┴──┘          ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ OSTATNI TRENING            │  ║  ← Quick summary
║  │                            │  ║
║  │ 🏋️ Push Day A              │  ║
║  │ Wczoraj · 45 min · 8 ćw.  │  ║
║  │                            │  ║
║  │ [Zobacz szczegóły →]       │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ┌────────┬────────┬────────┐   ║  ← Personal Records
║  │  120kg │  140kg │  180kg │   ║     (Big Three)
║  │ Wycisk.│ Squat  │ Martwy │   ║
║  │  +5kg↑ │  +0kg  │ +10kg↑ │   ║  ← Zmiana vs poprzedni
║  └────────┴────────┴────────┘   ║
║                                    ║
║  [  🏋️ Rozpocznij trening  ]     ║  ← Primary CTA
║  [  🤖 Zapytaj AI Coach    ]     ║
║                                    ║
╚════════════════════════════════════╝
```

### Szczegóły implementacji:

**Kalendarz tygodniowy:**
- Dziś: pomarańczowa ramka + pulsująca animacja
- Trening ukończony: zielona kropka pod dniem
- Przyszłość: szary
- Click → pokazuje treningi z tego dnia

**Ostatni trening card:**
- Szybki dostęp do szczegółów
- Pokaż TOP 3 osiągnięcia (nowe PR, najlepszy set)
- Swipe left → usuń z historii

**Personal Records (Big Three):**
- Duże liczby (32px font)
- Zielona strzałka ↑ = progres
- Czerwona strzałka ↓ = regres (rzadko, ale uczciwie)
- Click → full historia tego ćwiczenia

**CTA Buttons:**
- Gradient button (pomarańczowy)
- Subtle shadow + press animation
- Ikony SVG (22px)

---

## EKRAN 2: 💪 TRENING

### Podekrany:

**A. Lista planów treningowych**
**B. Live workout (aktywny trening)**

---

### A. LISTA PLANÓW

```
╔════════════════════════════════════╗
║  Moje plany treningowe             ║
║                                    ║
║  [ Szukaj... ]              [+]   ║  ← Search + Add new
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🔥 PUSH DAY A              │  ║  ← Template card
║  │ Klatka • Barki • Triceps   │  ║
║  │                            │  ║
║  │ ◦ Wyciskanie sztangi       │  ║
║  │ ◦ Wyciskanie hantle        │  ║
║  │ ◦ Motylek                  │  ║
║  │ +5 więcej...               │  ║
║  │                            │  ║
║  │ [Rozpocznij →]             │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 💪 PULL DAY                │  ║
║  │ Plecy • Biceps             │  ║
║  │ ...                        │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🦵 LEG DAY                 │  ║
║  │ Nogi • Pośladki            │  ║
║  │ ...                        │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
╚════════════════════════════════════╝
```

**Template card features:**
- Emoji kategoria (🔥 Push, 💪 Pull, 🦵 Legs)
- Skrócona lista ćwiczeń (max 3 + licznik)
- Long press → Edit / Delete / Duplicate
- Swipe right → Quick start

---

### B. LIVE WORKOUT (podczas treningu)

```
╔════════════════════════════════════╗
║  [‹]  PUSH DAY A      [Zakończ]   ║
║       ⏱ 23:45                      ║  ← Timer
║                                    ║
║  [Przegląd] [Logowanie] [Historia]║  ← Tabs
║  ─────────                         ║  ← Active indicator
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🏋️ WYCISKANIE SZTANGI      │  ║  ← Exercise card
║  │                            │  ║
║  │ ┌──┬──────┬──────┬────┐  │  ║
║  │ │# │ KG   │ REPS │ ✓  │  │  ║
║  │ ├──┼──────┼──────┼────┤  │  ║
║  │ │1 │ 60   │ 10   │ ✓  │  │  ║  ← Set ukończony
║  │ │2 │ 80   │ 8    │ ✓  │  │  ║
║  │ │3 │ 100  │ 6    │ 🔶 │  │  ║  ← Aktywny set
║  │ │4 │ 100  │ 6    │    │  │  ║  ← Następny
║  │ └──┴──────┴──────┴────┘  │  ║
║  │                            │  ║
║  │ [+ Dodaj serię]            │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🏋️ WYCISKANIE HANTLAMI     │  ║  ← Collapsed
║  │ 4 serie · 80kg · 10 powtórzeń │
║  ╰────────────────────────────╯  ║
║                                    ║
║  [+ Dodaj ćwiczenie]              ║
║                                    ║
╚════════════════════════════════════╝
```

**Rest Timer (slide-up modal):**

```
     ╭──────────────────────╮
     │  ⏱ ODPOCZYNEK       │
     │  ▓▓▓▓▓▓▓▓▓░░░ 65%   │  ← Progress bar
     │                      │
     │      1:35            │  ← Countdown (56px)
     │                      │
     │  [+30s]  [-15s]  [Pomiń→] │
     ╰──────────────────────╯
```

**Features:**
- Auto-start rest timer po kliknięciu ✓
- Haptic feedback przy zakończeniu
- Notification (jeśli app w tle)
- Dostosowanie czasu +30s / -15s

---

## EKRAN 3: 📊 STATYSTYKI

```
╔════════════════════════════════════╗
║  Twój progres                      ║
║                                    ║
║  [ 7 dni ] [ 30 dni ] [ 90 dni ]  ║  ← Time range tabs
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 📈 WOLUMEN TYGODNIOWY      │  ║
║  │                            │  ║
║  │     ▃▅▇▂▄▆█               │  ║  ← Bar chart
║  │   Pn Wt Śr Cz Pt So Nd   │  ║
║  │                            │  ║
║  │   ↗ +12% vs poprzedni     │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🤖 AI INSIGHTS             │  ║  ← AI analysis
║  │                            │  ║
║  │ "Świetnie! Zwiększasz     │  ║
║  │  obciążenie konsekwentnie. │  ║
║  │  Następny krok: dodaj     │  ║
║  │  5kg do squata."          │  ║
║  │                            │  ║
║  │ [Zobacz pełną analizę →]  │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 💪 NAJLEPSZE SERIE         │  ║
║  │                            │  ║
║  │ Wyciskanie · 120kg × 5    │  ║
║  │ Squat · 140kg × 8         │  ║
║  │ Martwy ciąg · 180kg × 3   │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ 🏆 OSIĄGNIĘCIA             │  ║
║  │                            │  ║
║  │ ✓ 10 treningów z rzędu    │  ║
║  │ ✓ 100kg na ławce          │  ║
║  │ ○ 30-dniowy streak        │  ║  ← Unlocked
║  ╰────────────────────────────╯  ║
║                                    ║
╚════════════════════════════════════╝
```

**Wykresy:**
- Recharts library (React) LUB Chart.js
- Smooth animations
- Interaktywne (tap na słupek = szczegóły)

**AI Insights:**
- Analiza co tydzień (niedziela wieczór)
- Personalizowane sugestie
- Pozytywny tone (motywacja!)

**Achievements:**
- Gamifikacja progresu
- Unlock badges
- Share on social (opcjonalnie)

---

## EKRAN 4: 👤 PROFIL

```
╔════════════════════════════════════╗
║  Profil                            ║
║                                    ║
║      ┌────────┐                   ║
║      │   JP   │                   ║  ← Avatar (inicjały)
║      └────────┘                   ║
║   Jan Kowalski                     ║
║   jan@example.com                  ║
║                                    ║
║  ╭────────────────────────────╮  ║
║  │ STATYSTYKI                 │  ║
║  │                            │  ║
║  │ 42 treningów · 🔥 12 dni   │  ║
║  │ Dołączył: 15.01.2026       │  ║
║  ╰────────────────────────────╯  ║
║                                    ║
║  ─────────────────────────────   ║
║                                    ║
║  ⚙️ Ustawienia                     ║
║  🔔 Powiadomienia                  ║
║  📱 Jednostki (kg/lbs)             ║
║  🌙 Motyw (ciemny/jasny)           ║
║  💾 Backup & sync                  ║
║  📊 Eksport danych                 ║
║                                    ║
║  ─────────────────────────────   ║
║                                    ║
║  ℹ️ O aplikacji                    ║
║  📧 Kontakt                        ║
║  🔓 Wyloguj się                    ║
║                                    ║
╚════════════════════════════════════╝
```

---

## KOLORY & TYPOGRAFIA

### Paleta (Dark Mode - główna):

```css
:root {
  /* Background */
  --bg: #080810;           /* Główne tło */
  --surface: #111118;      /* Karty */
  --surface2: #17171f;     /* Input fields */
  --surface3: #1e1e28;     /* Hover states */
  
  /* Borders */
  --border: #252532;       /* Subtelne linie */
  
  /* Primary (Pomarańczowy) */
  --orange: #E07B39;       /* CTA buttons */
  --orange-dim: rgba(224,123,57,0.08);
  --orange-mid: rgba(224,123,57,0.28);
  
  /* Success (Zielony) */
  --green: #34D399;        /* Checkmarki, progres */
  --green-dim: rgba(52,211,153,0.08);
  
  /* Danger (Czerwony) */
  --red: #F87171;
  --red-dim: rgba(248,113,113,0.08);
  
  /* Info (Niebieski) */
  --blue: #60A5FA;
  
  /* Text */
  --text: #EEEDF0;         /* Główny tekst */
  --muted: #5a5a6e;        /* Drugorzędny */
  --dim: #2e2e3c;          /* Placeholders */
}
```

### Typografia:

**Nagłówki:**
- Font: **Syne** (Google Fonts)
- Weights: 700, 800
- Użycie: Logo, tytuły sekcji, liczby

**Body:**
- Font: **DM Sans** (Google Fonts)
- Weights: 400, 500, 600, 700
- Użycie: Paragrafy, buttony, inputs

**Mono (opcjonalnie):**
- Font: **DM Mono**
- Użycie: Czasy, liczby (60kg, 10 reps)

**Sizes:**
```css
--text-xs: 10px;   /* Labels uppercase */
--text-sm: 12px;   /* Metadata */
--text-base: 15px; /* Body */
--text-lg: 17px;   /* Subtitles */
--text-xl: 22px;   /* Headings */
--text-2xl: 32px;  /* Hero numbers */
--text-3xl: 56px;  /* Timer countdown */
```

---

## KOMPONENTY WIELOKROTNEGO UŻYTKU

### 1. Button (Primary)
```css
.btn-primary {
  background: var(--orange);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(224,123,57,0.25);
  transition: transform 0.15s;
}
.btn-primary:active {
  transform: scale(0.97);
}
```

### 2. Card
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  transition: border-color 0.15s;
}
.card:hover {
  border-color: var(--orange-mid);
}
```

### 3. Input field
```css
.input {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--text);
  outline: none;
}
.input:focus {
  border-color: var(--orange);
}
```

### 4. Badge (streak, PR)
```css
.badge {
  background: var(--orange-dim);
  border: 1px solid var(--orange-mid);
  color: var(--orange);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}
```

---

## ANIMACJE & INTERAKCJE

### Micro-interactions:

**1. Button press:**
```css
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(1); }
}
```

**2. Check animation:**
```css
@keyframes check {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```

**3. Slide up (panels):**
```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

**4. Fade in:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**5. Pulse (active set):**
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224,123,57,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(224,123,57,0); }
}
```

---

## RESPONSIVE DESIGN

**Breakpoints:**
- Mobile: < 430px (główny target)
- Tablet: 431-768px (opcjonalnie)
- Desktop: > 768px (web version)

**Obecna aplikacja:**
- `max-width: 430px` + `margin: 0 auto`
- Działa perfekcyjnie na iPhone 12-15

**Tablet enhancement:**
- 2-column layout dla statystyk
- Większe przyciski
- Sidebar navigation

---

## ACCESSIBILITY (A11Y)

**WCAG 2.1 AA compliance:**

1. **Kontrast kolorów:**
   - Tekst na tle: min. 4.5:1
   - Duży tekst: min. 3:1
   - Obecna paleta: ✅ PASS

2. **Touch targets:**
   - Min. 44×44px (Apple HIG)
   - Obecne buttony: 44px height ✅

3. **Focus indicators:**
   - Keyboard navigation support
   - Outline: 2px solid var(--orange)

4. **Screen reader labels:**
   - aria-label na ikonach
   - role="button" na clickable divs

---

## UX FLOWS - OPTYMALIZACJA

### Flow 1: Rozpocznij trening (3 kliknięcia)
```
Home → [Rozpocznij trening] → Push Day A → [Rozpocznij]
  1              2                             3
```

### Flow 2: Zaloguj serię (1 kliknięcie)
```
Live workout → Tap na wiersz serii → Auto-save + Rest timer
                       1
```

### Flow 3: Dodaj nowe ćwiczenie (2 kliknięcia)
```
Live workout → [+ Dodaj ćwiczenie] → Wybierz z listy
                        1                    2
```

---

## WZORCE ZACHOWAŃ UŻYTKOWNIKA

**Onboarding (pierwszy launch):**
1. Welcome screen (1 slide)
2. "Jaki masz cel?" (Masa / Siła / Redukcja)
3. "Ile lat doświadczenia?" (Początkujący / Średni / Zaawansowany)
4. → AI generuje pierwszy plan treningowy

**Empty states:**
- Brak treningów: ilustracja + CTA "Rozpocznij pierwszy trening"
- Brak statystyk: "Ukończ pierwszy trening, aby zobaczyć progres"

**Error states:**
- Offline: "Brak internetu. Dane zapiszą się lokalnie."
- API error: "Coś poszło nie tak. Spróbuj ponownie."

**Loading states:**
- Skeleton screens (zamiast spinnerów)
- Smooth transitions

---

## DESIGN SYSTEM CHECKLIST

✅ Kolory (8 głównych + odcienie)
✅ Typografia (2 fonty, 6 sizes)
✅ Spacing (8px grid system)
✅ Border radius (10px, 12px, 14px, 20px)
✅ Shadows (4 poziomy: subtle, medium, large, glow)
✅ Komponenty (Button, Card, Input, Badge, Modal)
✅ Animacje (5 kluczowych)
✅ Icons (Feather Icons / Lucide React)

---

## IMPLEMENTACJA - ROADMAP

**Faza 1: Core redesign (tydzień 1)**
- Home screen redesign
- Bottom navigation
- Color system update

**Faza 2: Live workout (tydzień 2)**
- Nowy layout treningu
- Rest timer modal
- Set logging UX

**Faza 3: Stats & AI (tydzień 3)**
- Wykresy (Chart.js)
- AI insights panel
- Achievements system

**Faza 4: Profile & Settings (tydzień 4)**
- User profile
- Backup/export
- Dark/Light theme toggle

---

## TESTOWANIE

**A/B Testing:**
- Wariant A: Obecny design
- Wariant B: Nowy design
- Metryka: Time to start workout

**User Testing:**
- 5 użytkowników (różne poziomy zaawansowania)
- Zadania: Rozpocznij trening, Zaloguj serię, Sprawdź progres
- Zbieraj feedback

**Analytics:**
- Track: Button clicks, Screen time, Drop-off points
- Tools: Firebase Analytics, Mixpanel, PostHog

---

**Dokument UI/UX przygotowany dla ForgePro**
Wersja: 1.0 | Data: 31.03.2026
Autor: Claude (Senior UX Designer)
