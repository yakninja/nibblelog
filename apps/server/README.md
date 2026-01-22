# Server (apps/server)

Requirements: **Python 3.14+**, Docker & Docker Compose, Postgres

Quick start (first time):

```bash
cd apps/server

# Create a Python 3.14 virtual environment
python3.14 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run server
PYTHONPATH=$PWD .venv/bin/uvicorn app.main:app --reload --port 8000
```

Notes:

- The repository should not include the `.venv/` directory. If you find `.venv/` committed, remove it from the repo and re-create your virtualenv locally using Python 3.14.
- Add `EXPO_PUBLIC_API_URL` in `apps/client/.env` when testing on a device.
