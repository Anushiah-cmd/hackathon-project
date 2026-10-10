"""
CRIMVEXA WITNESS -- Backend Tests
Run with: python test_backend.py
"""

import json
import os
import tempfile
import unittest

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
        })

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def setUp(self):
        self.client = self.flask_app.test_client()
        with self.flask_app.app_context():
            with get_connection() as conn:
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
        )

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")

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

        stored = self.client.get(f"/api/complaints/{data['complaint_id']}")
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
        response = self.client.get("/api/complaints")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["total"], 1)
        self.assertEqual(len(response.json["complaints"]), 1)

    def test_get_unknown_complaint(self):
        response = self.client.get("/api/complaints/CW-NOTREAL")
        self.assertEqual(response.status_code, 404)

    def test_analysis_classifies_and_saves_suggestions(self):
        created = self.submit({
            "description": "A fake OTP call transferred money from my bank account."
        }).json
        response = self.client.post(
            f"/api/complaints/{created['complaint_id']}/analyze"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["category"], "Online / Cyber Fraud")
        self.assertIn("priority", response.json)
        self.assertIsInstance(response.json["missing_fields"], list)
        self.assertIsInstance(response.json["similar_cases"], list)

        stored = self.client.get(
            f"/api/complaints/{created['complaint_id']}"
        ).json
        self.assertEqual(stored["category"], response.json["category"])
        self.assertIsInstance(stored["briefing"], dict)

    def test_analysis_unknown_complaint(self):
        response = self.client.post("/api/complaints/CW-NOTREAL/analyze")
        self.assertEqual(response.status_code, 404)

    def test_status_update_and_persistence(self):
        complaint_id = self.submit().json["complaint_id"]
        response = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": "Under Review"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "Under Review")

        stored = self.client.get(f"/api/complaints/{complaint_id}")
        self.assertEqual(stored.json["status"], "Under Review")

    def test_status_update_rejects_invalid_or_non_object_input(self):
        complaint_id = self.submit().json["complaint_id"]
        invalid = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": "CLOSED_FOREVER"},
        )
        self.assertEqual(invalid.status_code, 400)

        wrong_type = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json={"status": ["Resolved"]},
        )
        self.assertEqual(wrong_type.status_code, 400)

        non_object = self.client.patch(
            f"/api/complaints/{complaint_id}/status",
            json=["Resolved"],
        )
        self.assertEqual(non_object.status_code, 400)

    def test_status_update_unknown_complaint(self):
        response = self.client.patch(
            "/api/complaints/CW-NOTREAL/status",
            json={"status": "Resolved"},
        )
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
