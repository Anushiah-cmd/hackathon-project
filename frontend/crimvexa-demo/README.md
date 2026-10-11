# CRIMVEXA AI web application

This browser application uses the Flask API and SQLite database described in
the repository's [main README](../../README.md). It includes citizen
registration/sign-in, complaint intake and tracking, evidence upload, and
staff case review.

Start the API from `backend` with `python app.py`, then serve this folder with
`python -m http.server 8000` and open <http://127.0.0.1:8000/index.html>.

Category and priority are rule-based suggestions for human review. This local
application does not submit reports to a police authority or provide emergency
response, OCR, identity verification, or external AI services. Use synthetic
information only; call 112 in India in an emergency.
