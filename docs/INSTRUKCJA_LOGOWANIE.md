# FORGEPRO - SYSTEM LOGOWANIA
## Instrukcja wdrożenia Firebase Authentication

---

## KROK 1: KONFIGURACJA FIREBASE

### 1.1 Utwórz projekt Firebase
1. Wejdź na https://console.firebase.google.com
2. Kliknij "Add project" / "Dodaj projekt"
3. Nazwa projektu: `forgepro-app`
4. Analytics: TAK (opcjonalne)
5. Kliknij "Create project"

### 1.2 Dodaj aplikację Web
1. W konsoli Firebase → kliknij ikonę `</>` (Web)
2. Nazwa aplikacji: `ForgePro Web`
3. Firebase Hosting: NIE (używasz Railway)
4. Kliknij "Register app"
5. **SKOPIUJ** konfigurację Firebase:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "forgepro-app.firebaseapp.com",
  projectId: "forgepro-app",
  storageBucket: "forgepro-app.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abc123"
};
```

6. Zapisz te dane! Wkleisz je w kodzie.

---

## KROK 2: WŁĄCZ METODY LOGOWANIA

### 2.1 Email/Password
1. W Firebase Console → Authentication → Sign-in method
2. Kliknij "Email/Password"
3. Włącz pierwszy przełącznik (Email/Password)
4. Kliknij "Save"

### 2.2 Google Sign-In
1. W tym samym miejscu → kliknij "Google"
2. Włącz przełącznik
3. Project support email: wybierz swój email
4. Kliknij "Save"

### 2.3 Apple Sign-In (opcjonalnie)
**WYMAGANE dla iOS App Store!**

1. Kliknij "Apple"
2. Włącz przełącznik
3. **Dodatkowa konfiguracja Apple:**
   - Apple Developer Account (99 USD/rok)
   - Bundle ID twojej apki
   - Services ID z Apple Developer
   - Private Key (.p8 file)

**→ Na razie POMIŃ Apple jeśli testujesz tylko PWA na Railway**

---

## KROK 3: WKLEJ KOD DO APLIKACJI

### 3.1 Otwórz plik `forgepro-auth-system.html`
Znajdź linię 30:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",  // ← ZASTĄP
  authDomain: "your-project.firebaseapp.com",  // ← ZASTĄP
  // ... reszta
};
```

### 3.2 Wklej SWOJE dane Firebase
Dane skopiowane w Kroku 1.2.

### 3.3 Zapisz plik

---

## KROK 4: TESTOWANIE LOKALNE

### 4.1 Uruchom serwer lokalny
```bash
# Otwórz terminal w folderze z plikiem HTML
python3 -m http.server 8000

# LUB jeśli masz Node.js:
npx http-server -p 8000
```

### 4.2 Otwórz w przeglądarce
http://localhost:8000/forgepro-auth-system.html

### 4.3 Testuj wszystkie metody:
✅ Rejestracja email → sprawdź skrzynkę emailową
✅ Logowanie email
✅ Google Sign-In
✅ Reset hasła
✅ Wylogowanie

---

## KROK 5: INTEGRACJA Z OBECNĄ APLIKACJĄ

### 5.1 Gdzie dodać kod?
W pliku `/public/index.html` (twój obecny ForgePro):

**Na górze <head>:**
```html
<!-- Firebase SDK -->
<script type="module" src="auth.js"></script>
```

**Nowy plik `/public/auth.js`:**
Skopiuj cały blok <script type="module"> z `forgepro-auth-system.html` (linie 13-227) do nowego pliku `auth.js`.

### 5.2 Dodaj HTML logowania
Dodaj ekran logowania PRZED ekranem "home" w twoim HTML:

```html
<div id="auth-screen" class="screen active">
  <!-- Skopiuj cały HTML z forgepro-auth-system.html -->
</div>
```

### 5.3 Logika routing'u
W `auth.js` po zalogowaniu:

```javascript
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('home').style.display = 'block';
  // Załaduj dane użytkownika z localStorage
  loadUserData();
}
```

---

## KROK 6: BEZPIECZEŃSTWO - WAŻNE!

### 6.1 Firestore Rules (gdy dodasz bazę)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // User może czytać/pisać tylko swoje dane
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

### 6.2 Authorized domains
Firebase Console → Authentication → Settings → Authorized domains

Dodaj:
- `localhost` (dev)
- `forgepro-app.up.railway.app` (twoja domena Railway)

---

## KROK 7: DEPLOY NA RAILWAY

### 7.1 Commit zmian do GitHub
```bash
git add .
git commit -m "Add Firebase authentication"
git push origin main
```

### 7.2 Railway auto-deploy
Railway automatycznie wykryje zmiany i wdroży.

### 7.3 Sprawdź produkcję
Otwórz swoją domenę Railway → testuj logowanie.

---

## KOSZTY

| Usługa | Free Tier | Koszt |
|--------|-----------|-------|
| Firebase Authentication | 50,000 MAU/mies | $0 |
| Firebase Firestore | 1GB storage, 50k reads/day | $0 |
| Railway | 500h/mies | $0 |
| **RAZEM** | | **$0/miesiąc** |

**MAU** = Monthly Active Users (użytkownicy logujący się w miesiącu)

---

## TROUBLESHOOTING

### Błąd: "Firebase API key invalid"
→ Sprawdź czy skopiowałeś całą konfigurację

### Błąd: "Unauthorized domain"
→ Dodaj domenę w Firebase Console → Authorized domains

### Email weryfikacyjny nie dochodzi
→ Sprawdź SPAM
→ Firebase Console → Authentication → Templates → zmień szablon

### Google Sign-In nie działa na iPhone
→ Dodaj domenę Railway do Authorized domains
→ Wymuś HTTPS (Railway robi to automatycznie)

---

## NEXT STEPS

Po wdrożeniu logowania:

1. **Dodaj Firestore** (baza danych)
2. **Migruj localStorage → Firestore**
3. **Cloud Functions** (backend logic)
4. **Push notifications**
5. **User profiles**

---

## GOTOWE SNIPPETY KODU

### Pobranie danych zalogowanego użytkownika:
```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  console.log('User ID:', user.uid);
  console.log('Email:', user.email);
  console.log('Email verified:', user.emailVerified);
  console.log('Display name:', user.displayName);
  console.log('Photo URL:', user.photoURL);
}
```

### Zapisz dane użytkownika w Firestore:
```javascript
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const db = getFirestore();

await setDoc(doc(db, 'users', user.uid), {
  email: user.email,
  createdAt: new Date(),
  displayName: 'Jan Kowalski',
  workouts: []
});
```

### Pobierz dane użytkownika:
```javascript
import { getDoc } from 'firebase/firestore';

const docRef = doc(db, 'users', user.uid);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  console.log('User data:', docSnap.data());
} else {
  console.log('No user data found!');
}
```

---

## KONTAKT & WSPARCIE

- Firebase Docs: https://firebase.google.com/docs/auth
- Firebase Console: https://console.firebase.google.com
- Stack Overflow: Tag `firebase-authentication`

---

**Dokument przygotowany dla projektu ForgePro**
Wersja: 1.0 | Data: 31.03.2026
