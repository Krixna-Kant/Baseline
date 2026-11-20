from fastapi.testclient import TestClient

from baseline_engine.api import app


def test_health_reports_versions():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["threshold_version"] == "v0"
