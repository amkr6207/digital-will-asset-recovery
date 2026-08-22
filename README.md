# Digital Will & Asset Recovery

Self-custodial **dead-man switch** for digital inheritance and account recovery.

## Live Demo

- Frontend (Vercel): [https://digital-will-asset-recovery.vercel.app](https://digital-will-asset-recovery.vercel.app)
- Source Code (GitHub): [https://github.com/amkr6207/digital-will-asset-recovery](https://github.com/amkr6207/digital-will-asset-recovery)
- Backend (Render): [https://digital-will-asset-recovery.onrender.com](https://digital-will-asset-recovery.onrender.com)

## Problem Statement

If someone loses access to their phone or passes away, families often lose access to important digital assets:

- bank communications
- utility/bill accounts
- subscriptions
- wallet recovery metadata

Traditional “legacy contact” approaches are usually centralized, app-specific, and unreliable across services.

## Solution

Digital Will uses a **self-custodial recovery design**:

- Vault data is encrypted in-browser (Web Crypto API).
- User passphrase is split using Shamir Secret Sharing.
- Trusted contacts hold independent shares.
- If owner misses the check-in window, recovery can be initiated.
- Threshold shares unlock decryption for family recovery.

## Architecture Docs

- System Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- ER Diagram: [ERD.md](./ERD.md)

## Tech Stack

- Frontend: React, Tailwind CSS, Vite
- Backend: Node.js, Express, MongoDB (Mongoose)
- Security: JWT, bcrypt, validation middleware, rate limiting, Helmet
- Crypto: Web Crypto API (AES-GCM + PBKDF2), Shamir Secret Sharing
- Deployment: Vercel (frontend), Render (backend)
- DevOps: Docker, Docker Compose, GitHub Actions CI

## How It Works (Flow)

1. User registers/logs in.
2. User creates encrypted vault in browser.
3. Passphrase is split into shares and distributed to trusted contacts.
4. User periodically checks in to prove active status.
5. If inactivity threshold is crossed, recovery session starts.
6. Contacts submit shares; threshold unlocks vault recovery.
7. Family reconstructs secret and decrypts vault content.

## Project structure

- `backend/` API server
- `frontend/` React app
- `deploy/frontend-nginx/default.conf` nginx config for SPA serving
- `.github/workflows/ci.yml` CI pipeline

## Local development

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/digital_will
JWT_SECRET=replace_with_long_random_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_ISSUER=digital-will-api
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RECOVERY_EXPIRY_HOURS=168
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## Run with Docker Compose

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000/api/health`

