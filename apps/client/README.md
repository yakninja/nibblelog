# Nibblelog Client

Local-first activity logger built with Expo and React Native.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (macOS) or Android Studio
- Backend server running (see `../server/README.md`)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file (or use `.env.example`):
```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

For iOS simulator, use `http://localhost:8000`  
For Android emulator, use `http://10.0.2.2:8000`  
For physical device, use your machine's IP: `http://192.168.x.x:8000`

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Architecture

### Local-First Design
- SQLite for local storage
- Append-only delta log
- Last-write-wins (LWW) conflict resolution
- Manual sync with push/pull

### Project Structure

```
src/
├── db/
│   ├── index.ts          # Database initialization
│   ├── schema.ts         # Table schemas
│   └── queries.ts        # CRUD operations & merge logic
├── services/
│   ├── auth.ts           # Authentication service
│   ├── sync.ts           # Sync service (push/pull)
│   └── AuthContext.tsx   # Auth context provider
├── screens/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CategoriesScreen.tsx
│   ├── AddCategoryScreen.tsx
│   ├── LogActivityScreen.tsx
│   └── ActivitiesScreen.tsx
└── types/
    └── index.ts          # TypeScript types
```

### Data Flow

1. **User Action** → Update local SQLite
2. **Create Delta** → Log change to deltas table
3. **Manual Sync** → Push unsent deltas, pull remote deltas
4. **Apply Deltas** → Merge with LWW resolution

## Features

- ✅ JWT authentication
- ✅ Local SQLite database
- ✅ Category management
- ✅ Activity logging
- ✅ Manual sync (pull to refresh)
- ✅ Offline-first operation
- ✅ Conflict resolution (LWW)

## Development Notes

### Database Schema
Tables: `categories`, `activities`, `deltas`, `sync_state`

### Sync Protocol
- Push: POST `/sync/push` with unsent deltas
- Pull: GET `/sync/pull?cursor=<seq>&device_id=<id>`
- Deltas marked as sent after successful push

### Conflict Resolution
Last-write-wins using `updated_at` timestamp (ms), tiebreak by `device_id`

## Known Limitations (MVP)

- Manual sync only (no background)
- No analytics/insights
- Plain password storage in env (use hashed in production)
- No widgets or lock screen logging

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

### Web
```bash
npm run build
# Output in dist/
```
