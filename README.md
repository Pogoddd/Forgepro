# 🔥 ForgePro — Instrukcja uruchomienia

## Krok 1 — Darmowy klucz Groq API (2 minuty, bez karty)

1. Wejdź na https://console.groq.com
2. Kliknij "Sign Up" — możesz zalogować się przez GitHub
3. Kliknij "API Keys" → "Create API Key"
4. Skopiuj klucz (zaczyna się od `gsk_...`) — zapisz go!

---

## Krok 2 — Wrzuć projekt na GitHub (3 minuty)

Rozpakuj ZIP, otwórz terminal w folderze `forgepro-app`:

```bash
git init
git add .
git commit -m "ForgePro init"
```

Wejdź na **github.com** → kliknij "+" → "New repository":
- Nazwa: `forgepro-app`
- Kliknij "Create repository"

Skopiuj komendy które GitHub pokazuje i wklej w terminalu:
```bash
git remote add origin https://github.com/TWOJ_LOGIN/forgepro-app.git
git branch -M main
git push -u origin main
```

---

## Krok 3 — Wdróż na Railway (5 minut, darmowe)

1. Wejdź na https://railway.app
2. Kliknij "Login" → zaloguj się przez GitHub
3. Kliknij "New Project" → "Deploy from GitHub repo"
4. Wybierz repozytorium `forgepro-app`
5. Poczekaj ~2 minuty aż Railway wdroży aplikację

### Dodaj klucz API:
1. Kliknij na projekt → zakładka **"Variables"**
2. Kliknij **"Add Variable"**
3. Nazwa: `GROQ_API_KEY`
4. Wartość: `gsk_...` (Twój klucz z kroku 1)
5. Kliknij "Add" — Railway automatycznie zrestartuje

### Pobierz link:
1. Zakładka **"Settings"** → **"Domains"**
2. Kliknij **"Generate Domain"**
3. Dostaniesz link np. `forgepro-app.up.railway.app`

---

## Krok 4 — Zainstaluj na iPhone jako apka

1. Otwórz **Safari** na iPhone
2. Wejdź na swój link Railway
3. Naciśnij ikonę **Udostępnij** (kwadrat ze strzałką w górę)
4. Wybierz **"Dodaj do ekranu głównego"**
5. Nazwij **"ForgePro"** → **"Dodaj"**

Masz ikonkę na ekranie głównym — działa jak natywna apka! 🎉

---

## Lokalny test na komputerze

```bash
cd forgepro-app
npm install

# Utwórz plik .env z kluczem:
echo "GROQ_API_KEY=gsk_TWOJ_KLUCZ" > .env

# Uruchom serwer (dodaj require('dotenv').config() na górze server.js):
node -e "require('dotenv').config(); require('./server.js')"

# Otwórz w przeglądarce:
# http://localhost:3000
```

---

## Koszty

| Usługa | Koszt |
|--------|-------|
| Railway | Darmowe (500h/mies) |
| Groq API | **Całkowicie darmowe** (14 400 req/dzień) |
| GitHub | Darmowe |
| **RAZEM** | **$0/miesiąc** |
