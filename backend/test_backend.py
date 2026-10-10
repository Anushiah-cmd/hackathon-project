"""
CRIMVEXA WITNESS -- Backend Tests
Run with:  python test_backend.py
"""

import json
import sys
import unittest

# Start the app in test mode before importing routes
import app as app_module
flask_app = app_module.create_app()
flask_app.config["TESTING"] = True


class CrimvexaTests(unittest.TestCase):

    def setUp(self):
        self.client = flask_app.test_client()

    # -- 1. Health check -------------------------------------------------------
    def test_01_health(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["status"], "ok")
        print("[PASS] test_01_health")

    # -- 2. Valid complaint submission -----------------------------------------
    def test_02_submit_valid(self):
        payload = {
            "description": "My mobile phone was snatched near the bus stand by someone on a motorcycle.",
            "location": "Central Bus Stand, Chennai",
            "incident_time": "2024-01-15 18:30",
            "item_details": "iPhone 13, black colour, worth 60000",
            "escape_direction": "Towards Anna Salai"
        }
        r = self.client.post("/api/complaints",
                             data=json.dumps(payload),
                             content_type="application/json")
        self.assertEqual(r.status_code, 201)
        data = r.json
        self.assertIn("complaint_id", data)
        self.assertTrue(data["complaint_id"].startswith("CW-"))
        self.assertEqual(data["status"], "New")
        CrimvexaTests._cid = data["complaint_id"]
        print(f"[PASS] test_02_submit_valid -> {data['complaint_id']}")

    # -- 3. Invalid complaint (no description) ---------------------------------
    def test_03_submit_invalid(self):
        r = self.client.post("/api/complaints",
                             data=json.dumps({"location": "Somewhere"}),
                             content_type="application/json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("error", r.json)
        print("[PASS] test_03_submit_invalid")

    # -- 4. List complaints ----------------------------------------------------
    def test_04_list_complaints(self):
        r = self.client.get("/api/complaints")
        self.assertEqual(r.status_code, 200)
        self.assertIn("complaints", r.json)
        self.assertIsInstance(r.json["complaints"], list)
        print(f"[PASS] test_04_list_complaints -> {r.json['total']} complaint(s)")

    # -- 5. Get specific complaint ---------------------------------------------
    def test_05_get_complaint(self):
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.get(f"/api/complaints/{cid}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["complaint_id"], cid)
        print(f"[PASS] test_05_get_complaint -> {cid}")

    # -- 6. Unknown complaint ID -----------------------------------------------
    def test_06_get_unknown(self):
        r = self.client.get("/api/complaints/CW-NOTREAL")
        self.assertEqual(r.status_code, 404)
        print("[PASS] test_06_get_unknown")

    # -- 7. Analyze complaint --------------------------------------------------
    def test_07_analyze(self):
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.post(f"/api/complaints/{cid}/analyze")
        self.assertEqual(r.status_code, 200)
        data = r.json
        self.assertIn("category", data)
        self.assertIn("priority", data)
        self.assertIn("missing_fields", data)
        self.assertIn("similar_cases", data)
        print(f"[PASS] test_07_analyze -> {data['category']} / {data['priority']}")

    # -- 8. Category & priority suggestions ------------------------------------
    def test_08_category_priority(self):
        payload = {
            "description": "I received a fake OTP call and 20000 was transferred from my bank account."
        }
        r = self.client.post("/api/complaints",
                             data=json.dumps(payload),
                             content_type="application/json")
        self.assertEqual(r.status_code, 201)
        data = r.json
        self.assertEqual(data["category"], "Online / Cyber Fraud")
        print(f"[PASS] test_08_category_priority -> {data['category']} / {data['priority']}")

    # -- 9. Similar synthetic case matching ------------------------------------
    def test_09_similar_cases(self):
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.post(f"/api/complaints/{cid}/analyze")
        similar = r.json.get("similar_cases", [])
        self.assertIsInstance(similar, list)
        if similar:
            self.assertIn("case_id", similar[0])
        print(f"[PASS] test_09_similar_cases -> {len(similar)} match(es)")

    # -- 10. Valid status update -----------------------------------------------
    def test_10_status_update_valid(self):
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.patch(f"/api/complaints/{cid}/status",
                              data=json.dumps({"status": "Under Review"}),
                              content_type="application/json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["status"], "Under Review")
        print("[PASS] test_10_status_update_valid")

    # -- 11. Invalid status update ---------------------------------------------
    def test_11_status_update_invalid(self):
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.patch(f"/api/complaints/{cid}/status",
                              data=json.dumps({"status": "CLOSED_FOREVER"}),
                              content_type="application/json")
        self.assertEqual(r.status_code, 400)
        print("[PASS] test_11_status_update_invalid")

    # -- 12. DB persistence ----------------------------------------------------
    def test_12_persistence(self):
        """Complaint submitted earlier must still be retrievable."""
        cid = getattr(CrimvexaTests, "_cid", None)
        if not cid:
            self.skipTest("No complaint ID from earlier test")
        r = self.client.get(f"/api/complaints/{cid}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["status"], "Under Review")
        print("[PASS] test_12_persistence")


if __name__ == "__main__":
    loader = unittest.TestLoader()
    loader.sortTestMethodsUsing = lambda a, b: (a > b) - (a < b)
    suite  = loader.loadTestsFromTestCase(CrimvexaTests)
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
