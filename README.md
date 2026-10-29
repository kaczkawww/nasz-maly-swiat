# Nasz mały świat — strona dla Myszki

Mobilna, romantyczna strona o Waszej relacji. Nie jest zrobiona pod rocznicę — licznik pokazuje po prostu czas od początku związku.

## Uruchomienie lokalnie w Termuxie

```bash
pkg update -y
pkg install -y python git
cd ~/nasz-maly-swiat
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Otwórz `http://127.0.0.1:8000`. Aby udostępnić stronę w sieci lokalnej, serwer nasłuchuje na `0.0.0.0`; nie oznacza to automatycznie, że jest dostępna publicznie w internecie.

## Playlista muzyki

Wrzucaj piosenki do `assets/music/` (np. `assets/music/piosenka-1.mp3`, `assets/music/piosenka-2.mp3`). Serwer automatycznie wykrywa pliki audio z tego folderu i z głównego `assets/`. Obsługiwane rozszerzenia: MP3, M4A, OGG, WAV, AAC, FLAC, OPUS i WEBA. Po dodaniu plików odśwież stronę — pojawią się w rozwijanej liście. Można wybrać utwór, przechodzić do poprzedniego/następnego i automatycznie odtworzyć kolejny po zakończeniu. Możesz też wybrać plik z telefonu, ale będzie widoczny tylko lokalnie.

Muzyka nie uruchamia się sama, bo przeglądarki zwykle blokują autoplay z dźwiękiem. Upewnij się, że masz prawa do publikowania udostępnianych utworów.

## Zdjęcia

Wybór zdjęć na stronie tworzy lokalny podgląd i nie przesyła ich na serwer. Aby opublikować zdjęcia dla odwiedzających, umieść je w `assets/photos/` i dodaj ich karty do galerii w `index.html` lub skonfiguruj je w przyszłej wersji. Nie umieszczaj tam prywatnych zdjęć, których nie chcesz pokazywać publicznie.

## Backend

- `GET /api/health` — status serwera
- `GET /api/playlist` — lista utworów z `assets/music/` i `assets/`
- `GET /api/messages` — publiczne wiadomości
- `POST /api/messages` — zapis wiadomości (każdy może je potem zobaczyć)

Endpoint wiadomości jest przygotowany pod rozbudowę. Wiadomości są zapisywane do `data/messages.json`. Darmowy hosting Render może mieć nietrwały system plików, więc plik może zniknąć przy restarcie lub wdrożeniu. Do trwałego zapisu potrzebna jest baza danych lub dysk trwały.

## Render

Plik `render.yaml` opisuje usługę. Wgraj cały katalog do repozytorium GitHub, a następnie na Render wybierz **New + → Blueprint** i wskaż repozytorium. Możesz też utworzyć Web Service ręcznie z: Build Command `pip install -r requirements.txt`, Start Command `gunicorn server:app --bind 0.0.0.0:$PORT --workers 1`.

## Personalizacja

- `config.js` — teksty, data początku relacji i wiadomości
- `styles.css` — wygląd
- `app.js` — interakcje
- `assets/music/` — piosenki wykrywane automatycznie przez playlistę
