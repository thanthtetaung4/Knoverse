from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app as app_module
import chat_ai

AUTH = {"X-Internal-Token": "test-token"}
UPLOAD_BODY = {"fileName": "team/abc/doc.pdf", "teamId": "team", "fileId": "file-1"}


@pytest.fixture
def client(monkeypatch):
    # Don't reach out to Ollama during tests.
    monkeypatch.setattr(app_module, "_warm_up_models", lambda: None)
    with TestClient(app_module.app) as c:
        yield c


@pytest.fixture
def fake_storage(monkeypatch):
    class Bucket:
        def download(self, name):
            return b"%PDF-1.4 fake"

    class Storage:
        def from_(self, bucket):
            return Bucket()

    class Supabase:
        storage = Storage()

    monkeypatch.setattr(chat_ai, "get_supabase", lambda: Supabase())


def test_health_needs_no_token(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.parametrize("headers", [{}, {"X-Internal-Token": "wrong"}])
def test_endpoints_reject_missing_or_wrong_token(client, headers):
    assert client.post("/uploadFile", json=UPLOAD_BODY, headers=headers).status_code == 401
    assert client.post("/chat", json={"message": "hi", "sessionId": "s", "teamId": "t"}, headers=headers).status_code == 401
    assert client.request("DELETE", "/deleteFile", json={"fileId": "f"}, headers=headers).status_code == 401


def test_missing_fields_are_rejected(client):
    assert client.post("/uploadFile", json={"teamId": "t"}, headers=AUTH).status_code == 400
    assert client.post("/chat", json={"message": "hi"}, headers=AUTH).status_code == 400
    assert client.request("DELETE", "/deleteFile", json={}, headers=AUTH).status_code == 400


def test_upload_sweeps_temp_file_after_successful_index(client, fake_storage, monkeypatch):
    seen = {}

    def fake_index(path, team_id, file_id):
        p = Path(path)
        seen["path"] = p
        # Written inside the server-controlled temp dir, not at the requested fileName.
        assert p.parent == app_module.UPLOAD_TMP_DIR
        assert p.read_bytes() == b"%PDF-1.4 fake"
        assert (team_id, file_id) == ("team", "file-1")
        return 3

    monkeypatch.setattr(app_module.pfu, "uploadFile", fake_index)

    r = client.post("/uploadFile", json=UPLOAD_BODY, headers=AUTH)

    assert r.status_code == 200
    assert r.json()["chunks"] == 3
    assert not seen["path"].exists()
    assert not Path("doc.pdf").exists() and not Path(UPLOAD_BODY["fileName"]).exists()


def test_upload_sweeps_temp_file_when_indexing_fails(client, fake_storage, monkeypatch):
    seen = {}

    def failing_index(path, team_id, file_id):
        seen["path"] = Path(path)
        raise RuntimeError("pinecone down")

    monkeypatch.setattr(app_module.pfu, "uploadFile", failing_index)

    r = client.post("/uploadFile", json=UPLOAD_BODY, headers=AUTH)

    assert r.status_code == 500
    assert r.json() == {"status": "error", "message": "pinecone down"}
    assert not seen["path"].exists()


def test_stale_uploads_are_swept_on_startup(monkeypatch, tmp_path):
    monkeypatch.setattr(app_module, "UPLOAD_TMP_DIR", tmp_path)
    monkeypatch.setattr(app_module, "_warm_up_models", lambda: None)
    stale, fresh = tmp_path / "stale.pdf", tmp_path / "fresh.pdf"
    stale.write_bytes(b"x")
    fresh.write_bytes(b"x")
    import os
    os.utime(stale, (0, 0))

    with TestClient(app_module.app):
        pass

    assert not stale.exists()
    assert fresh.exists()


def test_chat_history_is_rendered_oldest_first():
    rows = [
        {"role": "user", "content": "q1"},
        {"role": "assistant", "content": "a1"},
        {"role": "user", "content": "q2"},
    ]
    rendered = chat_ai.render_chat_history(chat_ai.format_chat_history_from_supabase(rows))
    assert rendered == "User: q1\nAssistant: a1\nUser: q2"
