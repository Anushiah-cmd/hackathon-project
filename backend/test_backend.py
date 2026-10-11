"""
CRIMVEXA WITNESS -- Backend Tests
Run with: python test_backend.py
"""

import json
import os
import tempfile
import unittest
from io import BytesIO

import app as app_module
from database import get_connection


class CrimvexaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_path = os.path.join(cls.temp_dir.name, "test-crimvexa.db")
        cls.flask_app = app_module.create_app({
            "TESTING": True,
            "DATABASE": cls.database_path,
            "UPLOAD_FOLDER": os.path.join(cls.temp_dir.name, "uploads"),
            "AUTH_SECRET": "test-secret-for-auth",
        })
        seed_client = cls.flask_app.test_client()
        seeded = {}
        for email, role in (
            ("default-citizen@example.test", "citizen"),
            ("default-officer@example.test", "officer"),
        ):
            response = seed_client.post("/api/auth/register", json={
                "full_name": "Test Account",
                "email": email,
                "password": "correct-horse-battery",
            })
            if response.status_code != 201:
                raise RuntimeError(f"Unable to seed test account: {response.json}")
            if role == "officer":
                with cls.flask_app.app_context():
                    with get_connection() as conn:
                        conn.execute(
                            "UPDATE users SET role = 'officer' WHERE email = ?",
                            (email,),
                        )
            login = seed_client.post("/api/auth/login", json={
                "email": email,
                "password": "correct-horse-battery",
            })
            seeded[role] = {"Authorization": f"Bearer {login.json['token']}"}
        cls.citizen_headers = seeded["citizen"]
        cls.officer_headers = seeded["officer"]

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def setUp(self):
        self.client = self.flask_app.test_client()
        with self.flask_app.app_context():
            with get_connection() as conn:
                conn.execute("DELETE FROM evidence")
                conn.execute("DELETE FROM status_history")
                conn.execute("DELETE FROM complaints")

    def submit(self, payload=None):
        return self.client.post(
            "/api/complaints",
            data=json.dumps(payload or {
                "description": (
                    "My mobile phone was snatched near the bus stand "
                    "by someone on a motorcycle."
                ),
                "location": "Central Bus Stand, Chennai",
                "incident_time": "2024-01-15 18:30",
                "item_details": "Black mobile phone",
                "escape_direction": "Towards Anna Salai",
            }),
            content_type="application/json",
            headers=self.citizen_headers,
        )

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")

    def test_oversized_requests_return_json_error(self):
        previous_limit = self.flask_app.config["MAX_CONTENT_LENGTH"]
        self.flask_app.config["MAX_CONTENT_LENGTH"] = 10
        try:
            response = self.client.post(
                "/api/complaints",
                data=b'{"payload":"01234567890"}',
                content_type="application/json",
                headers=self.citizen_headers,
            )
        finally:
            self.flask_app.config["MAX_CONTENT_LENGTH"] = previous_limit
        self.assertEqual(response.status_code, 413)
        self.assertIn("error", response.json)

    def test_submit_returns_complete_persisted_draft(self):
        response = self.submit()
        self.assertEqual(response.status_code, 201)
        data = response.json
        self.assertRegex(data["complaint_id"], r"^CW-[A-F0-9]{8}$")
        self.assertTrue(data["description"].startswith("My mobile phone"))
        self.assertEqual(data["location"], "Central Bus Stand, Chennai")
        self.assertEqual(data["status"], "New")
        self.assertIn("category", data)
        self.assertIn("priority", data)
        self.assertIsInstance(data["missing_fields"], list)
        self.assertIsInstance(data["similar_cases"], list)
        self.assertIn("NOT submitted", data["note"])

        stored = self.client.get(
            f"/api/complaints/{data['complaint_id']}",
            headers=self.citizen_headers,
        )
        self.assertEqual(stored.status_code, 200)
        self.assertEqual(stored.json["description"], data["description"])
        self.assertEqual(stored.json["location"], data["location"])

    def test_submit_requires_nonempty_description(self):
        response = self.submit({"description": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json)

    def test_submit_rejects_non_object_json(self):
        response = self.client.post(
            "/api/complaints",
            data=json.dumps(["not", "an", "object"]),
            content_type="application/json",
            headers=self.citizen_headers,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("JSON object", response.json["error"])

    def test_submit_rejects_wrong_field_types_and_oversized_values(self):
        wrong_type = self.submit({
            "description": "A valid incident description",
            "location": ["not", "text"],
        })
        self.assertEqual(wrong_type.status_code, 400)
        self.assertIn("location", wrong_type.json["error"])

        oversized = self.submit({"description": "x" * 10001})
        self.assertEqual(oversized.status_code, 400)
        self.assertIn("at most", oversized.json["error"])

    def test_list_complaints(self):
        self.submit()
        response = self.client.get("/api/complaints", headers=self.citizen_headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total"], 1)
        self.assertEqual(len(response.json["complaints"]), 1)

    def test_get_unknown_complaint(self):
        response = self.client.get(
            "/api/complaints/CW-NOTREAL", headers=self.citizen_headers
        )
        self.assertEqual(response.status_code, 404)

    def test_analysis_classifies_and_saves_suggestions(self):
        created = self.submit({
            "description": "A fake OTP call transferred money from my bank account."
        }).json
        response = self.client.post(
            f"/api/complaints/{created['complaint_id']}/analyze",
            headers=self.citizen_headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["category"], "Online / Cyber Fraud")
        self.assertIn("priority", response.json)
        self.assertIsInstance(response.json["missing_fields"], list)
        self.assertIsInstance(response.json["similar_cases"], list)

        stored = self.client.get(
            f"/api/complaints/{created['complaint_id']}",
            headers=self.citizen_headers,
        ).json
        self.assertEqual(stored["category"], response.json["category"])
        self.assertIsInstance(stored["briefing"], dict)

    def test_analysis_unknown_complaint(self):
        response = self.client.post(
            "/api/complaints/CW-NOTREAL/analyze",
            headers=self.citizen_headers,
        )
        self.assertEqual(response.status_code, 404)

    def test_status_update_and_persistence(self):
        complaint_id = self.submit().json["complaint_id"]
        response = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": "Under Review"},
            headers=self.officer_headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "Under Review")

        stored = self.client.get(
            f"/api/complaints/{complaint_id}", headers=self.citizen_headers
        )
        self.assertEqual(stored.json["status"], "Under Review")

    def test_status_update_rejects_invalid_or_non_object_input(self):
        complaint_id = self.submit().json["complaint_id"]
        invalid = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": "CLOSED_FOREVER"},
            headers=self.officer_headers,
        )
        self.assertEqual(invalid.status_code, 400)

        wrong_type = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": ["Resolved"]},
            headers=self.officer_headers,
        )
        self.assertEqual(wrong_type.status_code, 400)

        non_object = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json=["Resolved"],
            headers=self.officer_headers,
        )
        self.assertEqual(non_object.status_code, 400)

    def test_status_update_unknown_complaint(self):
        response = self.client.patch(
            "/api/complaints/CW-NOTREAL/status",
            json={"status": "Resolved"},
            headers=self.officer_headers,
        )
        self.assertEqual(response.status_code, 404)

    def register_and_login(self, email):
        created = self.client.post("/api/auth/register", json={
            "full_name": "Test Citizen",
            "email": email,
            "phone": "555-0100",
            "password": "correct-horse-battery",
        })
        self.assertEqual(created.status_code, 201)
        return created.json["token"]

    def test_authentication_and_owner_scoped_complaints(self):
        token = self.register_and_login("citizen@example.test")
        headers = {"Authorization": f"Bearer {token}"}
        created = self.client.post(
            "/api/complaints",
            json={
                "title": "Lost phone",
                "description": "My phone was stolen near the train station.",
                "location": "Central station",
                "incident_time": "2026-10-10 17:00",
                "reporter_name": "Test Citizen",
            },
            headers=headers,
        )
        self.assertEqual(created.status_code, 201)
        complaint_id = created.json["complaint_id"]
        self.assertEqual(created.json["title"], "Lost phone")

        own_case = self.client.get(
            f"/api/complaints/{complaint_id}", headers=headers
        )
        self.assertEqual(own_case.status_code, 200)
        self.assertEqual(own_case.json["status_history"][0]["new_status"], "New")

        other_token = self.register_and_login("other@example.test")
        private_case = self.client.get(
            f"/api/complaints/{complaint_id}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        self.assertEqual(private_case.status_code, 404)
        self.assertEqual(
            self.client.patch(
                f"/api/complaints/{complaint_id}/status",
                json={"status": "Resolved"},
                headers=headers,
            ).status_code,
            403,
        )

        login = self.client.post("/api/auth/login", json={
            "email": "citizen@example.test",
            "password": "correct-horse-battery",
        })
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json["user"]["role"], "citizen")
        self.assertEqual(
            self.client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {login.json['token']}"},
            ).status_code,
            200,
        )

    def test_citizen_can_edit_own_new_case_and_analysis_is_refreshed(self):
        token = self.register_and_login("editor@example.test")
        headers = {"Authorization": f"Bearer {token}"}
        created = self.client.post(
            "/api/complaints",
            json={"description": "A lost bag was reported."},
            headers=headers,
        ).json
        response = self.client.patch(
            f"/api/complaints/{created['complaint_id']}",
            json={
                "description": "A lost bag with documents was left in a taxi.",
                "location": "Central station",
            },
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["location"], "Central station")
        self.assertEqual(response.json["category"], "Lost Property")

        self.client.patch(
            f"/api/complaints/{created['complaint_id']}/status",
            json={"status": "Under Review"},
            headers=self.officer_headers,
        )
        locked = self.client.patch(
            f"/api/complaints/{created['complaint_id']}",
            json={"title": "Changed after review"},
            headers=headers,
        )
        self.assertEqual(locked.status_code, 409)

    def test_evidence_upload_and_download(self):
        complaint_id = self.submit().json["complaint_id"]
        upload = self.client.post(
            f"/api/complaints/{complaint_id}/evidence",
            data={"files": (BytesIO(b"%PDF-1.4\nvalid test document"), "evidence.pdf")},
            content_type="multipart/form-data",
            headers=self.citizen_headers,
        )
        self.assertEqual(upload.status_code, 201)
        evidence_id = upload.json["evidence"][0]["evidence_id"]
        listing = self.client.get(
            f"/api/complaints/{complaint_id}/evidence",
            headers=self.citizen_headers,
        )
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json["evidence"][0]["file_size"], 28)
        download = self.client.get(
            f"/api/evidence/{evidence_id}/file",
            headers=self.citizen_headers,
        )
        self.assertEqual(download.status_code, 200)
        self.assertTrue(download.data.startswith(b"%PDF-"))
        download.close()

    def test_dashboard_stats_are_database_backed(self):
        self.submit()
        self.submit({"description": "Received a fake bank OTP call and lost money."})
        response = self.client.get(
            "/api/dashboard/stats", headers=self.citizen_headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total"], 2)
        self.assertEqual(sum(response.json["by_status"].values()), 2)

    def test_invalid_tokens_never_fall_back_to_public_access(self):
        self.submit()
        anonymous = self.client.get("/api/complaints")
        self.assertEqual(anonymous.status_code, 401)
        response = self.client.get(
            "/api/complaints",
            headers={"Authorization": "Bearer invalid"},
        )
        self.assertEqual(response.status_code, 401)
        stats = self.client.get(
            "/api/dashboard/stats",
            headers={"Authorization": "Bearer invalid"},
        )
        self.assertEqual(stats.status_code, 401)

    def test_officer_assignment_notes_and_citizen_notifications(self):
        citizen_token = self.register_and_login("reporter@example.test")
        created = self.client.post(
            "/api/complaints",
            json={"description": "A suspicious online bank transfer was reported."},
            headers={"Authorization": f"Bearer {citizen_token}"},
        ).json
        complaint_id = created["complaint_id"]

        self.register_and_login("officer@example.test")
        with self.flask_app.app_context():
            with get_connection() as conn:
                conn.execute(
                    "UPDATE users SET role = 'officer' WHERE email = ?",
                    ("officer@example.test",),
                )
        officer_token = self.client.post("/api/auth/login", json={
            "email": "officer@example.test",
            "password": "correct-horse-battery",
        }).json["token"]
        officer_headers = {"Authorization": f"Bearer {officer_token}"}

        assigned = self.client.put(
            f"/api/complaints/{complaint_id}/assignment",
            json={},
            headers=officer_headers,
        )
        self.assertEqual(assigned.status_code, 200)
        note = self.client.post(
            f"/api/complaints/{complaint_id}/notes",
            json={"note": "Reviewed the submitted incident narrative."},
            headers=officer_headers,
        )
        self.assertEqual(note.status_code, 201)
        notes = self.client.get(
            f"/api/complaints/{complaint_id}/notes", headers=officer_headers
        )
        self.assertEqual(
            notes.json["notes"][0]["note"],
            "Reviewed the submitted incident narrative.",
        )

        status = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": "Under Review"},
            headers=officer_headers,
        )
        self.assertEqual(status.status_code, 200)
        notifications = self.client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        notification_id = notifications.json["notifications"][0]["notification_id"]
        marked = self.client.patch(
            f"/api/notifications/{notification_id}/read",
            headers={"Authorization": f"Bearer {citizen_token}"},
        )
        self.assertEqual(marked.status_code, 200)


if __name__ == "__main__":
    unittest.main(verbosity=2)
