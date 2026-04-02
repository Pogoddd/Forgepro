# 🔥 ForgePro — AI-Powered Fitness Tracker

Nowoczesna aplikacja PWA do trackowania treningów siłowych z wykorzystaniem sztucznej inteligencji (Groq API).

---

## 🆕 CO NOWEGO W TEJ WERSJI

✅ **System logowania** (Firebase Authentication)  
✅ **Dokumentacja UI/UX** (kompletny redesign)  
✅ **3 grafiki promocyjne** (HTML/CSS)  
✅ **Gotowe do wdrożenia na GitHub**

---

## 📁 STRUKTURA PROJEKTU

```
forgepro-app/
├── public/
│   ├── index.html          # Główna aplikacja PWA
│   ├── auth.html           # System logowania (Firebase)
│   └── promo/              # Grafiki promocyjne
│       ├── forgepro-promo-brutalist.html
│       ├── forgepro-promo-gradient.html
│       └── forgepro-promo-cyberpunk.html
├── docs/
│   ├── INSTRUKCJA_LOGOWANIE.md     # Jak wdrożyć Firebase Auth
│   └── FORGEPRO_UIUX_REDESIGN.md   # Dokumentacja UI/UX
├── server.js               # Backend (Express + Groq API)
├── package.json
├── railway.toml
└── README.md
```

---

## 🚀 WGRYWANIE NA GITHUB — KROK PO KROKU

### OPCJA A: Nowe repozytorium

```bash
# 1. Otwórz terminal w folderze forgepro-app
cd forgepro-app

# 2. Zainicjuj Git (jeśli nie ma .git)
git init

# 3. Dodaj wszystkie pliki
git add .

# 4. Commit
git commit -m "ForgePro - dodano auth system, dokumentację i grafiki promo"

# 5. Połącz z GitHub (zamień TWOJ_LOGIN na swój nick GitHub)
git remote add origin https://github.com/TWOJ_LOGIN/forgepro-app.git

# 6. Wypchnij na GitHub
git branch -M main
git push -u origin main
```

### OPCJA B: Aktualizacja istniejącego repo

```bash
# 1. Otwórz terminal w folderze forgepro-app
cd forgepro-app

# 2. Dodaj nowe pliki
git add .

# 3. Commit
git commit -m "Add Firebase Auth, UI/UX docs, promo graphics"

# 4. Wypchnij
git push origin main
```

---

## 🔐 WDROŻENIE SYSTEMU LOGOWANIA

### Krok 1: Skonfiguruj Firebase

1. Wejdź na https://console.firebase.google.com
2. Utwórz nowy projekt "ForgePro"
3. Dodaj aplikację Web
4. Skopiuj konfigurację Firebase

### Krok 2: Wklej dane do kodu

Otwórz `public/auth.html` i znajdź linię ~30:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",        // ← WKLEJ SWOJE
  authDomain: "your-project...", // ← WKLEJ SWOJE
  // ... reszta
};
```

### Krok 3: Włącz metody logowania

W Firebase Console → Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google
- ✅ Apple (opcjonalnie)

### 📖 Pełna instrukcja: `docs/INSTRUKCJA_LOGOWANIE.md`

---

## 🎨 UŻYWANIE GRAFIK PROMOCYJNYCH

Grafiki znajdują się w `public/promo/`:

1. **Brutalist** (`forgepro-promo-brutalist.html`)
   - Ciemna, surowa, industrialna
   - Dla zaawansowanych użytkowników

2. **Gradient** (`forgepro-promo-gradient.html`)
   - Jasna, energetyczna, nowoczesna
   - Dla szerokiej grupy docelowej

3. **Cyberpunk** (`forgepro-promo-cyberpunk.html`)
   - Neon, futurystyczna, tech
   - Dla tech-savvy użytkowników

**Jak użyć:**
- Otwórz w przeglądarce → wybierz ulubioną
- Użyj na landing page, social media, App Store screenshots
- Dostosuj tekst (zmień hasła w HTML)

---

## 📱 URUCHOMIENIE LOKALNIE

### Wymagania
- Node.js 16+
- NPM

### Instalacja

```bash
cd forgepro-app
npm install

# Utwórz plik .env z kluczem Groq
echo "GROQ_API_KEY=gsk_TWOJ_KLUCZ" > .env

# Uruchom serwer
npm start
# LUB
node server.js

# Otwórz w przeglądarce
# http://localhost:3000
```

---

## ☁️ DEPLOY NA RAILWAY

### Krok 1: Wypchnij na GitHub (patrz wyżej)

### Krok 2: Railway setup

1. Wejdź na https://railway.app
2. Login przez GitHub
3. New Project → Deploy from GitHub repo
4. Wybierz `forgepro-app`

### Krok 3: Dodaj klucz API

W Railway → Variables:
- Klucz: `GROQ_API_KEY`
- Wartość: `gsk_...` (Twój klucz Groq)

### Krok 4: Wygeneruj domenę

Settings → Domains → Generate Domain

**🎉 Gotowe! Aplikacja działa na Railway.**

---

## 📚 DOKUMENTACJA

### System logowania
📖 `docs/INSTRUKCJA_LOGOWANIE.md`
- Konfiguracja Firebase
- Integracja z aplikacją
- Bezpieczeństwo
- Troubleshooting

### UI/UX Design
📖 `docs/FORGEPRO_UIUX_REDESIGN.md`
- Architektura ekranów
- Design system (kolory, typografia)
- Komponenty
- Animacje
- Roadmapa implementacji

---

## 🔑 KLUCZE API

### Groq API (AI)
- Bezpłatny: 14,400 requestów/dzień
- Rejestracja: https://console.groq.com
- Dodaj w Railway Variables: `GROQ_API_KEY`

### Firebase (Auth + Database)
- Bezpłatny: 50,000 użytkowników/miesiąc
- Rejestracja: https://console.firebase.google.com
- Konfiguracja w `public/auth.html`

---

## 💰 KOSZTY

| Usługa | Free Tier | Miesięczny koszt |
|--------|-----------|------------------|
| Railway | 500h wykonania | **$0** |
| Groq API | 14,400 req/dzień | **$0** |
| Firebase Auth | 50,000 użytkowników | **$0** |
| Firebase Firestore | 1GB + 50k odczytów/dzień | **$0** |
| **RAZEM** | | **$0/miesiąc** |

---

## 🛠️ STACK TECHNOLOGICZNY

**Frontend:**
- Pure HTML/CSS/JavaScript (no framework)
- PWA (Progressive Web App)
- Firebase SDK 10.x (Authentication)

**Backend:**
- Node.js + Express
- Groq API (llama-3.3-70b)
- Railway hosting

**AI:**
- Model: Llama 3.3 70B (via Groq)
- Funkcje: Analiza progresu, sugestie treningowe, odpowiedzi na pytania

---

## 🐛 TROUBLESHOOTING

### Problem: "Brak GROQ_API_KEY"
→ Dodaj w Railway Variables LUB w pliku `.env` lokalnie

### Problem: Firebase błędy autoryzacji
→ Sprawdź czy dodałeś domenę Railway w Firebase Console → Authorized domains

### Problem: Aplikacja nie ładuje się
→ Sprawdź Railway logs: `railway logs`

### Problem: Git push error
→ Sprawdź czy masz połączone remote:
```bash
git remote -v
```

---

## 📞 WSPARCIE

- **Firebase Docs:** https://firebase.google.com/docs/auth
- **Groq API Docs:** https://console.groq.com/docs
- **Railway Docs:** https://docs.railway.app

---

## 📝 CHANGELOG

### v2.0.0 (2026-04-02)
- ➕ System logowania Firebase (Email, Google, Apple)
- ➕ Dokumentacja UI/UX (20 stron)
- ➕ 3 grafiki promocyjne (HTML/CSS)
- ➕ Nowa struktura folderów
- ➕ Instrukcje GitHub

### v1.0.0 (2026-03-29)
- ✨ Pierwsze wydanie
- AI Coach (Groq)
- Tracking treningów
- Import Excel/PDF
- PWA functionality

---

## 📄 LICENCJA

MIT License - możesz swobodnie modyfikować i używać komercyjnie.

---

## 🤝 CONTRIBUTING

Pull requesty mile widziane! 

```bash
# Fork repo
# Stwórz branch
git checkout -b feature/twoja-funkcja

# Commit
git commit -m "Add twoja-funkcja"

# Push
git push origin feature/twoja-funkcja

# Otwórz Pull Request na GitHub
```

---

## 🎯 ROADMAPA

### Q2 2026
- [ ] Integracja Firestore (synchronizacja danych)
- [ ] Service Worker (offline mode)
- [ ] Push notifications

### Q3 2026
- [ ] Stripe paywall (premium features)
- [ ] Social sharing (progress screenshots)
- [ ] Community leaderboards

### Q4 2026
- [ ] React Native / Flutter (native apps)
- [ ] App Store / Google Play submission
- [ ] Apple Watch integration

---

**Zbudowane z 💪 przez twórców ForgePro**

Wersja: 2.0.0 | Data: 02.04.2026
