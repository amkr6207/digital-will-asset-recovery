# Digital Will Architecture

## 1) High-Level Overview

Digital Will is a full-stack application with:

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Security: JWT auth + bcrypt hashing + request validation + rate limiting
- Crypto: Browser-side Web Crypto (AES-GCM + PBKDF2) + Shamir Secret Sharing

Core principle:

- Vault content is encrypted in the browser.
- Backend stores encrypted data and recovery state, not decrypted vault plaintext.

## 2) Connected System Diagram

```mermaid
flowchart TD
    U[User / Family / Friends]
    UI[React UI\nApp.jsx + Dashboard.jsx + AuthCard.jsx]
    API[Frontend API Client\napi/client.js]
    CRYPTO[Client Crypto Layer\nwebCrypto.js + shares.js]

    APP[Express App\napp.js]
    MID[Middlewares\nrequestId + CORS + helmet + rateLimit + errorHandler]

    AUTH[Auth Routes\n/api/auth]
    VAULT[Vault Routes\n/api/vault]
    DEAD[Deadman Routes\n/api/deadman]

    VAL[Validation Layer\nvalidation/schemas.js + middleware/validate.js]
    GUARD[JWT Auth Guard\nmiddleware/auth.js]
    SVC[Deadman Service\nservices/deadmanService.js]

    USER[(User Collection)]
    VCOL[(Vault Collection)]

    DOCKER[docker-compose\nMongo + Backend + Frontend]
    CI[GitHub Actions CI]

    U --> UI
    UI --> API
    UI --> CRYPTO
    CRYPTO --> UI

    API --> APP
    APP --> MID
    MID --> AUTH
    MID --> VAULT
    MID --> DEAD

    AUTH --> VAL
    AUTH --> USER

    VAULT --> VAL
    VAULT --> GUARD
    VAULT --> VCOL
    VAULT --> USER

    DEAD --> VAL
    DEAD --> GUARD
    DEAD --> SVC
    DEAD --> USER
    DEAD --> VCOL

    USER -. "1:1 owner" .- VCOL

    DOCKER --> APP
    DOCKER --> VCOL
    DOCKER --> UI
    CI --> APP
    CI --> UI

    classDef actor fill:#f59e0b,stroke:#b45309,color:#111827,stroke-width:2px;
    classDef frontend fill:#14b8a6,stroke:#0f766e,color:#062a28,stroke-width:2px;
    classDef backend fill:#3b82f6,stroke:#1d4ed8,color:#eff6ff,stroke-width:2px;
    classDef route fill:#2563eb,stroke:#1e40af,color:#eff6ff,stroke-width:2px;
    classDef data fill:#22c55e,stroke:#15803d,color:#052e16,stroke-width:2px;
    classDef devops fill:#a855f7,stroke:#7e22ce,color:#faf5ff,stroke-width:2px;

    class U actor;
    class UI,API,CRYPTO frontend;
    class APP,MID,VAL,GUARD,SVC backend;
    class AUTH,VAULT,DEAD route;
    class USER,VCOL data;
    class DOCKER,CI devops;
```

## 3) Data Relationship Snapshot

- `User` owns exactly one `Vault` (`owner` is unique in Vault)
- `Vault` contains `friends[]` (exactly 5 entries)
- `Vault` contains `submittedShares[]` (grows during recovery)
- Vault payload is stored encrypted (`encryptedVault`, `iv`, `salt`)
