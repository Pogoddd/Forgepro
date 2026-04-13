
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import {
      getAuth,
      GoogleAuthProvider,
      createUserWithEmailAndPassword,
      onAuthStateChanged,
      sendPasswordResetEmail,
      signInWithEmailAndPassword,
      signInWithPopup,
      signOut,
    } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

    const AUTH_SESSION_KEY = 'forgepro_auth_session_v1';
    const AUTH_USER_KEY = 'forgepro_auth_user_v1';

    const authNotice = document.getElementById('authNotice');
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    const modeSwitchBtn = document.getElementById('modeSwitchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    let isRegisterMode = false;
    let authEnabled = false;
    let auth;
    let googleProvider;

    function setNotice(message, tone = 'warn') {
      authNotice.textContent = message;
      authNotice.className = `notice show ${tone}`;
    }

    function clearNotice() {
      authNotice.textContent = '';
      authNotice.className = 'notice';
    }

    function setLoading(isLoading, label) {
      submitBtn.disabled = isLoading || !authEnabled;
      googleBtn.disabled = isLoading || !authEnabled;
      resetBtn.disabled = isLoading || !authEnabled;
      if (isLoading) {
        submitBtn.innerHTML = `<span class="loading">${label}</span>`;
      } else {
        submitBtn.textContent = isRegisterMode ? 'Załóż konto' : 'Zaloguj się';
      }
    }

    function setMode(nextRegisterMode) {
      isRegisterMode = nextRegisterMode;
      loginTab.classList.toggle('active', !nextRegisterMode);
      registerTab.classList.toggle('active', nextRegisterMode);
      submitBtn.textContent = nextRegisterMode ? 'Załóż konto' : 'Zaloguj się';
      modeSwitchBtn.textContent = nextRegisterMode
        ? 'Masz już konto? Zaloguj się'
        : 'Nie masz konta? Załóż konto';
      passwordInput.autocomplete = nextRegisterMode ? 'new-password' : 'current-password';
      clearNotice();
    }

    function saveSession(user) {
      const payload = {
        uid: user.uid,
        email: user.email || '',
        ts: Date.now(),
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload));
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload));
    }

    function clearSession() {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }

    function goToApp() {
      window.location.replace('/');
    }

    function mapAuthError(error) {
      const messages = {
        'auth/email-already-in-use': 'Ten adres email jest już używany.',
        'auth/invalid-email': 'Podaj poprawny adres email.',
        'auth/user-not-found': 'Nie znaleziono takiego konta.',
        'auth/wrong-password': 'Hasło jest nieprawidłowe.',
        'auth/invalid-credential': 'Dane logowania są nieprawidłowe.',
        'auth/weak-password': 'Hasło jest za słabe. Użyj minimum 6 znaków.',
        'auth/popup-closed-by-user': 'Logowanie zostało anulowane.',
        'auth/network-request-failed': 'Brak połączenia z internetem.',
      };
      return messages[error.code] || 'Nie udało się zalogować. Spróbuj ponownie.';
    }

    async function bootAuth() {
      setLoading(true, 'Ładowanie');
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        authEnabled = Boolean(config?.auth?.enabled);

        if (!authEnabled) {
          clearSession();
          setNotice(
            'Logowanie nie jest jeszcze skonfigurowane. Ustaw w Railway zmienne FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID i FIREBASE_APP_ID.',
            'warn'
          );
          setLoading(false);
          return;
        }

        const app = initializeApp(config.auth.firebase);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();

        if (new URLSearchParams(window.location.search).get('logout') === '1') {
          await signOut(auth).catch(() => {});
          clearSession();
          setNotice('Zostałeś wylogowany.', 'warn');
          setLoading(false);
          return;
        }

        onAuthStateChanged(auth, (user) => {
          if (!user) {
            clearSession();
            return;
          }
          saveSession(user);
          goToApp();
        });

        setLoading(false);
      } catch (error) {
        clearSession();
        setNotice('Nie udało się pobrać konfiguracji logowania z serwera.', 'error');
        setLoading(false);
      }
    }

    authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!authEnabled || !auth) return;

      clearNotice();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        setNotice('Uzupełnij email i hasło.', 'error');
        return;
      }

      setLoading(true, isRegisterMode ? 'Tworzenie konta' : 'Logowanie');
      try {
        if (isRegisterMode) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (error) {
        setNotice(mapAuthError(error), 'error');
        setLoading(false);
      }
    });

    googleBtn.addEventListener('click', async () => {
      if (!authEnabled || !auth || !googleProvider) return;
      clearNotice();
      setLoading(true, 'Logowanie');
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        setNotice(mapAuthError(error), 'error');
        setLoading(false);
      }
    });

    resetBtn.addEventListener('click', async () => {
      if (!authEnabled || !auth) return;
      clearNotice();
      const email = emailInput.value.trim();
      if (!email) {
        setNotice('Najpierw wpisz email, żeby wysłać link do resetu.', 'error');
        return;
      }

      setLoading(true, 'Wysyłanie');
      try {
        await sendPasswordResetEmail(auth, email);
        setNotice('Link do resetu hasła został wysłany na podany email.', 'warn');
      } catch (error) {
        setNotice(mapAuthError(error), 'error');
      } finally {
        setLoading(false);
      }
    });

    modeSwitchBtn.addEventListener('click', () => setMode(!isRegisterMode));
    loginTab.addEventListener('click', () => setMode(false));
    registerTab.addEventListener('click', () => setMode(true));

    setMode(false);
    bootAuth();
  
