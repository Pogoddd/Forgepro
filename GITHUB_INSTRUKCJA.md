# ⚡ SZYBKI START — JAK WGRAĆ NA GITHUB

## KROK 1: Utwórz repozytorium na GitHub

1. Wejdź na **github.com**
2. Kliknij przycisk **"+"** w prawym górnym rogu
3. Wybierz **"New repository"**
4. Nazwa: `forgepro-app`
5. Publiczne lub prywatne: **Twój wybór**
6. **NIE ZAZNACZAJ** "Add a README file"
7. Kliknij **"Create repository"**

---

## KROK 2: Otwórz terminal w folderze forgepro-app

**Windows:**
- Otwórz folder `forgepro-app` w Eksploratorze
- Kliknij prawym w pustym miejscu
- Wybierz "Otwórz w terminalu" LUB "Git Bash here"

**Mac:**
- Otwórz Terminal
- Wpisz: `cd ` (ze spacją)
- Przeciągnij folder `forgepro-app` do okna terminala
- Naciśnij Enter

---

## KROK 3: Wklej komendy (jedna po drugiej)

**Zamień `TWOJ_LOGIN` na swój nick GitHub!**

```bash
# Inicjalizuj Git
git init

# Dodaj wszystkie pliki
git add .

# Commit
git commit -m "ForgePro v2.0 - dodano auth, dokumentację, grafiki"

# Połącz z GitHub (ZAMIEŃ TWOJ_LOGIN!)
git remote add origin https://github.com/TWOJ_LOGIN/forgepro-app.git

# Wypchnij na GitHub
git branch -M main
git push -u origin main
```

---

## KROK 4: Sprawdź GitHub

Odśwież stronę GitHub — wszystkie pliki powinny być tam! 🎉

---

## CO DALEJ?

1. **Deploy na Railway** → Zobacz `README.md` sekcja "Deploy na Railway"
2. **Skonfiguruj Firebase** → Zobacz `docs/INSTRUKCJA_LOGOWANIE.md`
3. **Obejrzyj grafiki** → Otwórz pliki w `public/promo/`

---

## ⚠️ JEŚLI COŚ POSZŁO NIE TAK:

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TWOJ_LOGIN/forgepro-app.git
```

### Error: "fatal: not a git repository"
```bash
# Upewnij się, że jesteś w folderze forgepro-app
pwd  # Mac/Linux
cd   # Windows

# Powinno pokazać ścieżkę kończącą się na /forgepro-app
```

### Error: "permission denied"
```bash
# Zaloguj się do GitHub w terminalu
gh auth login

# LUB użyj Personal Access Token zamiast hasła
# https://github.com/settings/tokens
```

---

## 🆘 POTRZEBUJESZ POMOCY?

1. Sprawdź `README.md` w tym folderze
2. Zobacz sekcję "Troubleshooting"
3. Poproś ChatGPT/Claude o pomoc z dokładnym błędem

---

**Powodzenia! 🚀**
