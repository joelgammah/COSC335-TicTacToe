# Tiny Towns

A web-based implementation of the Tiny Towns board game, featuring resource placement, building patterns, score tracking, and achievement unlocking. This repository contains both the **frontend** (React + Vite) and **backend** (Express + Firebase) components.

---

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Repository Structure](#repository-structure)
* [Setup and Configuration](#setup-and-configuration)

  * [Backend (Express + Firebase)](#backend-express--firebase)
  * [Frontend (Vite + React)](#frontend-vite--react)
* [Local Development](#local-development)
* [Testing](#testing)
* [Deployment](#deployment)

  * [Environment Variables](#environment-variables)
  * [Docker (Optional)](#docker-optional)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Interactive grid** for placing resources and buildings
* **Pattern validation** for each building type
* **Real-time scoring** with full Tiny Towns rules
* **Firebase** for user authentication, game persistence, and achievements
* **REST API** for saving/loading games and achievements
* **Unit tests** for game logic and UI components (60%+ coverage)

---

## Prerequisites

* **Node.js** v16 or higher
* **npm** or **yarn**
* A **Firebase** project with Firestore and Authentication enabled

  * Service account JSON key
* Optional: **Docker** and **Docker Compose** for containerized deployment

---

## Repository Structure

```
/                  # root
├─ /backend         # Express API server
│   ├─ server.js    # main Express app
│   ├─ serviceAccountKey.json (ignored)  # Firebase Admin key
│   └─ .env         # API env vars
├─ /app             # Frontend (React/Vite)
│   ├─ src/
│   ├─ tests/
│   ├─ vite.config.js
│   └─ .env         # FRONTEND env vars
└─ README.md        # this file
```

---

## Setup and Configuration

### Backend (Express + Firebase)

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Firebase service account**

   * In your Firebase console, go to *Project Settings → Service Accounts → Generate New Private Key*.
   * Download the JSON file and save it as `serviceAccountKey.json` in `backend/`.

3. **Environment variables**

   Create a `.env` in `backend/`:

   ```ini
   VITE_BACKEND_PORT=3000
   FIREBASE_DATABASE_URL=https://<your-project>.firebaseio.com
   ```

4. **Start server**

   ```bash
   npm run dev
   # or
   node server.js
   ```

   The API will be available at `http://localhost:3000`.

---

### Frontend (Vite + React)

1. **Install dependencies**

   ```bash
   cd app
   npm install
   ```

2. **Environment variables**

   Create a `.env` in `app/`:

   ```ini
   VITE_BACKEND_URL=http://localhost:3000
   VITE_FIREBASE_API_KEY=<your-firebase-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
   VITE_FIREBASE_PROJECT_ID=<your-project-id>
   ```

3. **Start frontend**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

---

## Local Development

* **Frontend** hot-reloads on changes via Vite
* **Backend** auto-restarts on file changes via nodemon (if configured)
* Proxy configuration in `vite.config.js` forwards `/api`, `/save-game`, etc. to backend

---

## Testing

* **Unit tests** for game logic and components via `vitest` + `@testing-library/react`

* Run:

  ```bash
  cd app
  npm run test
  ```

* Test coverage report available under `coverage/`.

---

## Deployment

### Environment Variables

Ensure the following env vars are set in your production environment:

* **Backend**:

  * `FIREBASE_DATABASE_URL`
  * `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON)

* **Frontend**:

  * `VITE_BACKEND_URL` (public URL of your API)
  * `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`

### Docker (Optional)

A `Dockerfile` and `docker-compose.yml` can be provided to containerize both services.

```yaml
# docker-compose.yml
version: '3'
services:
  backend:
    build: ./backend
    volumes:
      - ./backend/serviceAccountKey.json:/app/serviceAccountKey.json
    ports:
      - '3000:3000'
    environment:
      - FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL}
  frontend:
    build: ./app
    ports:
      - '5173:5173'
    environment:
      - VITE_BACKEND_URL=http://localhost:3000
```

```bash
# Build & run all containers
docker-compose up --build
```

---

## Contributing

Contributions are welcome! Please open issues and submit pull requests.

1. Fork the repo
2. Create a feature branch
3. Commit and push
4. Open a PR and describe your changes

---

## License

MIT © Tiny Towns Contributors
