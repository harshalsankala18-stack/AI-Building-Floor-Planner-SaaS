# Production Deployment Guide: AI Building Floor Planner SaaS

This document outlines the architecture, environment variables, build commands, and hosting configuration for deploying the frontend and backend services.

---

## 1. Architectural Overview

The application is structured into two independently deployable services:

```
┌─────────────────────────────────┐           HTTPS API           ┌─────────────────────────────────────┐
│  React SPA (Vercel)             │ ────────────────────────────> │  Node.js Backend Service            │
│  - Vite + React 18 + Three.js   │  POST /api/v1/generation/run  │  (Render / Railway / Fly / AWS)     │
│  - Static Asset Delivery        │  GET  /api/v1/health          │  - Long-running generation jobs     │
│  - Configured by VITE_API_BASE_ │                               │  - Persistent filesystem artifacts  │
└─────────────────────────────────┘                               │  - Credentials stored server-side   │
                                                                  └─────────────────────────────────────┘
```

> [!IMPORTANT]
> **Why the Backend Cannot Run on Vercel Serverless Functions:**
> 1. **Long-Running Generation Requests:** The multi-stage pipeline (concept generation, visual preflight, image interpretation, and Gemini evaluation) can take several minutes. Vercel hobby functions timeout after 10-60 seconds.
> 2. **Filesystem Artifact Persistence:** Generated plan images, reference schematics, and evaluation artifacts are stored on disk (`IMAGE_ARTIFACT_DIR`). Serverless functions have ephemeral, read-only filesystems (except `/tmp` which is discarded across invocations).
> 3. **Process Boundaries:** The backend runs a dedicated HTTP server with long-lived timeouts (`GENERATION_REQUEST_TIMEOUT_MS = 15 minutes`) and holds secure provider credentials (Cloudflare, Gemini) that must never touch client code.

---

## 2. Frontend Deployment (Vercel)

### Project Configuration
* **Framework Preset**: Vite
* **Root Directory**: `packages/frontend` (or repo root with monorepo build command)
* **Build Command**: `pnpm --filter @ai-floor-planner/frontend build`
* **Output Directory**: `packages/frontend/dist` (or `dist` if Root Directory is `packages/frontend`)
* **Install Command**: `pnpm install`

### Environment Variables
Configure these in the Vercel Project Settings under **Settings > Environment Variables**:

| Variable Name | Environment | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Production | Fully qualified HTTPS URL of your deployed production backend service | `https://api.yourdomain.com` |
| `VITE_API_BASE_URL` | Preview | Fully qualified HTTPS URL of your staging or preview backend service | `https://staging-api.yourdomain.com` |

> [!WARNING]
> In production builds, `VITE_API_BASE_URL` is **mandatory**.
> If omitted or set to `localhost` / `127.0.0.1` in production, the application will display a clear configuration error banner rather than making broken localhost network calls, while keeping 2D CAD editing and DXF export accessible.

---

## 3. Backend Deployment (Node.js Service)

Host the backend on any platform supporting long-running Node.js containers or processes (e.g. Render Web Service, Railway, Fly.io, AWS ECS/App Runner, or DigitalOcean App Platform).

### Build & Start Commands
* **Build Command**:
  ```bash
  pnpm install && pnpm --filter @ai-floor-planner/backend build && pnpm --filter @ai-floor-planner/backend bundle
  ```
* **Start Command**:
  ```bash
  node packages/backend/dist-server/server.cjs
  ```

### Runtime Environment Variables

| Variable Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `4200` | Port the Node.js server listens on (cloud hosts like Render/Railway automatically inject this). |
| `NODE_ENV` | **Required** | `development` | Set to `production` in production environments. |
| `CORS_ALLOWED_ORIGINS` | **Required in Prod** | `[]` in prod | Comma-separated list of allowed frontend origins (e.g. `https://your-app.vercel.app,https://your-domain.com`). In development, defaults to local dev frontends (`http://localhost:3000`, `http://localhost:5173`). Wildcards (`*`) are disallowed in production mode. |
| `IMAGE_ARTIFACT_DIR` | **Required** | `data/image-artifacts` | Filesystem path for storing generated PNG and JSON plan artifacts. Must be mounted to a persistent disk or volume in production. |
| `DETERMINISTIC_CAD_FIRST` | Optional | `true` | When `true`, uses the instant deterministic stepped-polygon CAD engine for apartments, bypassing external raster image models. |
| `ENABLE_ARCHLANG` | Optional | `false` | When `true`, compiles generated buildings with ArchLang and runs geometry parity checks. |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | `""` | Cloudflare Account ID for FLUX Workers AI generation. |
| `CLOUDFLARE_API_TOKEN` | Optional | `""` | Cloudflare API Token for Workers AI. |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API Key for vision interpretation and architectural evaluation. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model name used for vision and evaluation. |

### Persistent Storage Requirement
The backend persists original image artifacts to `IMAGE_ARTIFACT_DIR`:
* On **Render**: Attach a Persistent Disk (e.g. `/var/data/artifacts`) and set `IMAGE_ARTIFACT_DIR=/var/data/artifacts`.
* On **Railway**: Add a Volume mounted at `/app/data/image-artifacts`.
* On **Fly.io**: Mount a volume to `data/image-artifacts`.

### Health Check Endpoint
* **Path**: `GET /api/v1/health`
* **Expected Status**: `200 OK`
* **Response Payload Example**:
  ```json
  {
    "status": "ok",
    "imageProvider": "configured",
    "imageGeneration": {
      "provider": "cloudflare-workers-ai",
      "configured": true,
      "reachable": true,
      "status": "REACHABLE",
      "model": "@cf/black-forest-labs/flux-2-klein-4b"
    },
    "gemini": {
      "configured": true,
      "reachable": true,
      "status": "REACHABLE",
      "model": "gemini-2.5-flash"
    }
  }
  ```

---

## 4. Verification Checklist Before Going Live

1. **Backend Verification**:
   - Send `GET /api/v1/health` to your deployed backend. Verify that `status` is `ok` or `degraded` with honest provider status.
   - Send `OPTIONS /api/v1/health` with `Origin: https://your-frontend.vercel.app` and confirm `204 No Content` with `Access-Control-Allow-Origin: https://your-frontend.vercel.app`.
2. **Frontend Verification**:
   - Deploy to Vercel with `VITE_API_BASE_URL=https://your-backend.yourhost.com`.
   - Open your Vercel URL in a browser and check DevTools Network tab:
     - Verify that requests go to `https://your-backend.yourhost.com/api/v1/...` and succeed.
     - Verify that NO requests are made to `127.0.0.1` or `localhost`.
