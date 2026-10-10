# CRIMVEXA AI static demo

This folder contains a standalone browser prototype of the CRIMVEXA reporting
workflow. It uses browser `localStorage` for demo cases and does not connect to
a backend, create official reports, or contact emergency services.

## Run locally

From this folder, start a local server:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/index.html> in a browser. The prototype includes
a complaint form, citizen dashboard, receipt, officer dashboard, mock filing
portal, and demo login and registration pages.

Do not enter real personal information or evidence. In an emergency in India,
call 112.
