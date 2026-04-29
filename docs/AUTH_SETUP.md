# ForgePro Auth Setup

## Cel
Uruchomić logowanie ForgePro przez Firebase tak, żeby działało:
- logowanie email/hasło
- logowanie Google
- sesja użytkownika w aplikacji

## 1. Utwórz projekt Firebase
1. Wejdź do Firebase Console.
2. Utwórz nowy projekt.
3. Dodaj aplikację typu Web.
4. Skopiuj `firebaseConfig`.

## 2. Włącz metody logowania
W Firebase:
1. `Authentication`
2. `Get started`
3. W zakładce `Sign-in method` włącz:
- `Email/Password`
- `Google`

## 3. Dodaj domeny
W Firebase:
1. `Authentication`
2. `Settings`
3. `Authorized domains`
4. Dodaj:
- domenę Railway, np. `twoja-apka.up.railway.app`
- własną domenę, jeśli jej używasz
- lokalnie: `localhost`

## 4. Ustaw zmienne w Railway
W serwisie ForgePro w Railway dodaj:

```env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
GROQ_API_KEY=...
ALLOWED_ORIGINS=https://twoja-apka.up.railway.app
```

Jeśli używasz kilku domen, rozdziel je przecinkami:

```env
ALLOWED_ORIGINS=https://twoja-apka.up.railway.app,https://twojadomena.pl
```

## 5. Zdeployuj aplikację
Po ustawieniu zmiennych:
1. zapisz zmiany w Railway
2. uruchom nowy deploy

## 6. Sprawdź konfigurację
Po deployu wejdź na:

```txt
/health
```

Jeśli wszystko jest dobrze, powinieneś zobaczyć:
- `auth: configured`

Możesz też wejść na:

```txt
/api/config
```

Tam `auth.enabled` powinno być `true`.

## 7. Test logowania
Po deployu:
1. otwórz `/auth.html`
2. załóż konto przez email/hasło
3. sprawdź login Google
4. po zalogowaniu aplikacja powinna wrócić do ForgePro

## 8. Co już jest gotowe w kodzie
- ekran logowania: `public/auth.html`
- wspólna obsługa sesji: `public/scripts/auth-shared.js`
- stan użytkownika w aplikacji: `public/scripts/app-state.js`
- publiczny endpoint config: `server.js`

## 9. Co będzie następnym krokiem
Po potwierdzeniu, że login działa:
1. sync danych użytkownika
2. przechowywanie treningów w chmurze
3. premium i subskrypcje
