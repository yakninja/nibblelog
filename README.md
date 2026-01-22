# nibblelog

A local-first activity logger with minimal backend for authentication and sync.

## Tech Stack

- **Client**: Expo (React Native) + TypeScript - runs on iOS and web
- **Server**: FastAPI + Postgres
- **Storage**: Local SQLite with append-only delta log
- **Sync**: Last-write-wins (LWW) conflict resolution

## Development Workflow

### Prerequisites

- Node.js 18+ (with npm or pnpm)
- Python 3.11+
- Docker & Docker Compose
- Xcode (for iOS development)

### 1. Start Postgres

```bash
docker compose up -d
docker compose ps  # verify it's running
```

### 2. Start Backend (FastAPI)

```bash
cd apps/server

# First time: create venv and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run server
PYTHONPATH=$PWD .venv/bin/uvicorn app.main:app --reload --port 8000
```

Backend will be available at: <http://localhost:8000>

API docs: <http://localhost:8000/docs>

### 3. Start Client (Expo)

```bash
cd apps/client

# First time: install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start Expo
npm start
```

Then press **`w`** to open in web browser, or scan QR code with Expo Go app.

### Test Credentials

```
Username: yak
Password: changeme
```

(configured in `apps/server/.env` via `NIBBLE_USERS`)

### Testing on iOS

#### iOS Simulator (macOS only)

Prerequisites:

- Xcode installed from Mac App Store
- Xcode Command Line Tools: `xcode-select --install`

Steps:

1. Make sure backend is running (`cd apps/server && uvicorn app.main:app --reload`)
2. Start Expo: `cd apps/client && npm start`
3. Press **`i`** to open in iOS Simulator
4. Wait for build to complete and app to launch

#### iOS Physical Device

##### Option 1: Expo Go (Quick & Easy)

1. Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
2. Make sure your phone and computer are on the same WiFi network
3. Start Expo: `cd apps/client && npm start`
4. Scan the QR code with your iPhone camera
5. App will open in Expo Go

##### Option 2: Development Build (Full Features)

For native features not supported by Expo Go:

```bash
cd apps/client

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build for iOS device
eas build --platform ios --profile development

# Install on device via TestFlight or direct install
```

**Note:** For local testing with Expo Go, make sure `EXPO_PUBLIC_API_URL` in `apps/client/.env` points to your computer's local IP address (e.g., `http://192.168.1.100:8000`) instead of `localhost`, so the phone can reach the backend.

### Useful Commands

```bash
# Run backend tests
cd apps/server
source .venv/bin/activate
pytest

# Check backend health
curl http://localhost:8000/health

# View Postgres logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```

## Project Structure

```
/
├── apps/
│   ├── client/          # Expo app (iOS + web)
│   └── server/          # FastAPI backend
├── infra/
│   ├── dev/            # Docker Compose for local dev
│   └── nginx/          # Nginx configs
└── .github/
    ├── copilot-instructions.md
    └── workflows/      # CI/CD pipelines
```

## MVP Features

- ✅ JWT authentication (no registration)
- ✅ Category CRUD
- ✅ Activity logging with optional fields (description, amount, score, location)
- ✅ Local-first storage (SQLite)
- ✅ Manual sync (push/pull deltas)
- ✅ Multi-user ready

## Production Deployment

Production runs on k0s with nginx TLS termination:

- Frontend: <https://nibble.yakninja.pro>
- API: <https://nibbleapi.yakninja.pro>

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for full deployment details.
