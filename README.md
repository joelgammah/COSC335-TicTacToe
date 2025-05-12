# Tiny Towns

A web-based implementation of the Tiny Towns board game, built with a React/Vite frontend and an Express/Firebase backend. It features resource placement, building patterns, scoring logic, achievements, user authentication, game saving/loading, and a global leaderboard.

---

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Project Structure](#project-structure)
* [Environment Configuration](#environment-configuration)
* [Local Development](#local-development)

  * [Backend](#backend)
  * [Frontend](#frontend)
* [Running Tests](#running-tests)
* [Building for Production](#building-for-production)
* [Docker (Optional)](#docker-optional)
* [Deployment](#deployment)
* [License](#license)

---

## Features

* **Resource placement** on a 4×4 grid
* **Building patterns** validation (cottages, farms, chapels, etc.)
* **Scoring logic** including negative penalties and special rules
* **Achievements** unlocked based on game state
* **User authentication** (Email/Password & Google) via Firebase
* **Game saving/loading** with Firestore
* **Global leaderboard** showing total points per user

---

## Prerequisites

Before you begin, make sure you have the following installed:

* [Node.js](https://nodejs.org/) (v14 or higher)
* npm (comes with Node)
* A Firebase project with Firestore and Authentication enabled
* Docker & Docker Compose

---

## Project Structure

```
├── firebaseConfig.json             # Firebase client SDK config
├── serviceAccountKey.json          # Firebase Admin SDK service account key
├── .env                            # Environment variables for Vite
├── server.js                       # Express + Firebase‑Admin backend
├── package.json                    # root-level scripts/deps (if monorepo)
├── vite.config.js                  # Vite config for frontend dev & proxy
├── src/                            # Frontend source (React, Vite)
│   ├── main.jsx
│   ├── TinyTowns.jsx               # Main app component
│   ├── ResourceDeck.jsx            # UI components...
│   ├── store.js                    # Zustand store + game logic hooks
│   ├── gameLogic.js                # Scoring & pattern matching
│   ├── logic.js                    # Achievement + user fetch helpers
│   ├── compat-api.js               # save/load API wrappers
│   └── ...
├── public/                         # Static assets
│   └── firebaseConfig.json         # served at `/firebaseConfig.json`
└── tests/                          # Vitest + React Testing Library tests

```

---

## Environment Configuration

1. **Firebase setup**:

   * Go to the [Firebase Console](https://console.firebase.google.com/).
   * Create a new project (or use an existing one).
   * In **Authentication**, enable Email/Password and Google providers.
   * In **Firestore**, create a database in **Native** mode.

2. **Service account key**:

   * In **Project Settings → Service Accounts**, click **Generate new private key**.
   * Download `serviceAccountKey.json` and place it in the project root alongside `server.js`.

3. **Client SDK config**:

   * In **Project Settings → General** under **Your apps**, register a new web app.
   * Copy the config snippet and save it as `public/firebaseConfig.json`:

     ```json
     {
       "apiKey": "YOUR_API_KEY",
       "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
       "projectId": "YOUR_PROJECT_ID",
       "storageBucket": "YOUR_PROJECT_ID.appspot.com",
       "messagingSenderId": "...",
       "appId": "..."
     }
     ```

4. **Environment variables** (`.env` in project root):

   ```bash
   VITE_BACKEND_URL=http://tictactoe-backend:3000
   VITE_BACKEND_PORT=3000
   ```

   * `VITE_BACKEND_URL`: the base URL your backend listens on (used by Vite proxy and API wrappers).
   * `VITE_BACKEND_PORT`: port for the Express server.

---

## Local Development

### Backend

1. Install dependencies:

   ```bash
   npm install
   ```
2. Start the server:

   ```bash
   npm run dev       # if you have a watch script, or
   node server.js
   ```
3. The API will listen on `http://localhost:3000` (or your `VITE_BACKEND_PORT`).

### Frontend

1. Install dependencies (in the same root if monorepo, or in `app/`):

   ```bash
   npm install
   ```
2. Start Vite dev server:

   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

   * The Vite dev server proxies all `/save-game`, `/Games`, `/api`, etc. calls to your backend via `VITE_BACKEND_URL`.

---

## Running Tests

Unit tests are written with Vitest and React Testing Library:

```bash
npm run test

# To generate a coverage report:
npm run test -- --coverage
```

Coverage reports (text + HTML) are generated in `coverage/`.

---

## Building for Production

### Frontend

1. Build the static assets:

   ```bash
   npm run build
   ```
2. Preview the production build:

   ```bash
   npm run serve     # or `vite preview`
   ```
3. Deploy the `dist/` folder to any static hosting (Netlify, Vercel, S3, etc.).

### Backend

1. Ensure `serviceAccountKey.json` and `.env` are provided in your production environment.
2. Start with a process manager:

   ```bash
   pm2 start server.js --name tiny-towns-api
   ```
3. Alternatively, containerize with Docker (see below).

---

## Docker (Optional)

A `compose.yaml` can orchestrate both frontend and backend:

```yaml
services:
  vite:
    image: node:22
    container_name: "tictactoe-vite-tt"
    ports:
      - "5173:5173"  
    working_dir: /app
    volumes:
      - ./app:/app
    command: sh -c "npm install && npx vite --host"
    restart: unless-stopped

  backend:
    image: node:22
    container_name: "tictactoe-backend"
    ports:
      - "3000:3000"
    working_dir: /app
    volumes:
      - ./app:/app
    command: sh -c "npm install && node server.js"
    restart: unless-stopped
```

Then:

```bash
docker-compose up --build
```

---

## Deployment

1. **Backend**: Deploy to a Node hosting provider (Heroku, DigitalOcean App Platform) or a Docker/Kubernetes cluster, making sure to mount `serviceAccountKey.json` securely and set environment variables.
2. **Frontend**: Deploy the `dist/` directory to a static host (Netlify, Vercel, S3 + CloudFront).
3. Update `VITE_BACKEND_URL` to your production API URL before building the frontend.

---

## License


