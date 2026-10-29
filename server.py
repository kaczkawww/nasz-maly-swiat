from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
from datetime import datetime, timezone
import json, os, re

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MESSAGES_FILE = DATA_DIR / "messages.json"
DATA_DIR.mkdir(exist_ok=True)
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024


def read_messages():
    try:
        data = json.loads(MESSAGES_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def write_messages(messages):
    DATA_DIR.mkdir(exist_ok=True)
    MESSAGES_FILE.write_text(json.dumps(messages[-100:], ensure_ascii=False, indent=2), encoding="utf-8")


@app.get("/api/health")
def health():
    return jsonify(status="ok", app="nasz-maly-swiat", timestamp=datetime.now(timezone.utc).isoformat())


@app.get("/api/playlist")
def get_playlist():
    """List audio files shipped with the site; users add tracks under assets/music/."""
    assets = BASE_DIR / "assets"
    roots = [assets / "music", assets]
    extensions = {".mp3", ".m4a", ".ogg", ".wav", ".aac", ".flac", ".opus", ".weba"}
    tracks, seen = [], set()
    for root in roots:
        if not root.is_dir():
            continue
        for file in sorted(root.iterdir(), key=lambda item: item.name.lower()):
            if not file.is_file() or file.suffix.lower() not in extensions or file.name in seen:
                continue
            # URLs are relative paths served by the existing static-file route.
            rel = file.relative_to(BASE_DIR).as_posix()
            tracks.append({"title": file.stem.replace("_", " ").replace("-", " "), "url": "/" + rel})
            seen.add(file.name)
    return jsonify(tracks=tracks)


@app.get("/api/messages")
def get_messages():
    # Messages posted here are visible to every visitor of this public site.
    return jsonify(messages=read_messages())


@app.post("/api/messages")
def post_message():
    payload = request.get_json(silent=True) or {}
    name = re.sub(r"\s+", " ", str(payload.get("name", "Gość"))).strip()[:32]
    message = re.sub(r"\s+", " ", str(payload.get("message", ""))).strip()[:280]
    if not message:
        return jsonify(error="Wiadomość nie może być pusta."), 400
    if len(message) < 2:
        return jsonify(error="Wiadomość jest za krótka."), 400
    messages = read_messages()
    messages.append({"name": name or "Gość", "message": message, "createdAt": datetime.now(timezone.utc).isoformat()})
    write_messages(messages)
    return jsonify(ok=True, message="Wiadomość zapisana.", messages=messages[-100:]), 201


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path):
    # Do not expose server source or runtime data via static URLs.
    if path == "server.py" or path.startswith("data/") or path in {"requirements.txt", "render.yaml"}:
        return jsonify(error="Not found"), 404
    target = (BASE_DIR / path).resolve()
    if BASE_DIR not in target.parents and target != BASE_DIR:
        return jsonify(error="Not found"), 404
    if target.is_file():
        return send_from_directory(target.parent, target.name)
    return send_from_directory(BASE_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
