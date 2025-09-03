# KeyCliq (Technical README)

A modern, production-ready template for building a full‑stack React app with **React Router v7**. This README is **technical‑only** (no business/SOW info).

## Features
- 🚀 **Server‑side rendering (SSR)** via React Router app server
- ⚡️ **Hot Module Replacement (HMR)** during development
- 📦 **Asset bundling & optimization**
- 🔄 **Data APIs** (co‑located **loaders** & **actions**)
- 🎉 **Tailwind CSS** preconfigured

## Tech Stack
- **App runtime:** React Router v7 CLI (Vite under the hood)
- **Language:** JavaScript/TypeScript
- **Node:** v20+ (Node 21 supported)
- **Styling:** Tailwind CSS (or any CSS framework you prefer)

## Requirements
- Node.js **20+** (`node -v`)
- npm (or pnpm/yarn — adjust commands accordingly)

## Getting Started
### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Your app will be available at **http://localhost:5173**.

### Scripts
Add/confirm these in `package.json`:
```json
{
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router start",
    "lint": "eslint .",
    "typecheck": "tsc -p .",
    "test": "vitest"
  }
}
```

## Environment Variables
Create a `.env` in the project root (placeholders below):
```bash
# App
NODE_ENV=development
SESSION_SECRET=change-me

# Database (example)
DATABASE_URL=postgres://user:pass@localhost:5432/keycliq

# Object storage (example)
STORAGE_BUCKET=keycliq-dev
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# AI provider (example)
AI_PROVIDER=
AI_API_KEY=
```
> Do **not** commit secrets. Use `.env.local` or your host's secret manager.

## Project Structure
```
app/
  root.(jsx|tsx)        # App root (document/links/meta, error boundaries)
  routes/               # Route modules (UI + data)
  routes.js             # OPTIONAL: manual routes file (overrides file‑based routing)
  components/           # Reusable UI
  lib/                  # Auth, storage, ai, utils
  styles/               # CSS/Tailwind
public/                  # Static assets
```

## Routing
This codebase currently uses a **manual routes file** (`app/routes.js`). When this file exists, it **opts out of file‑based routing** and you must **register every route** here.

**Example `app/routes.js`:**
```js
import { index } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  { path: "test", file: "routes/test.jsx" },
];
```

**Example route module:**
```jsx
// app/routes/test.jsx
export default function Test() {
  return <div>hello from /test</div>;
}
```

**Switch to file‑based routing:** delete `app/routes.js` and place route files under `app/routes/*`.

## Data Loaders & Actions
React Router’s data APIs allow you to co‑locate fetching/mutations with your routes.
```jsx
// app/routes/keys.$id.jsx
export async function loader({ params, request }) {
  const { id } = params;
  // fetch entity by id
  return { id };
}

export async function action({ request }) {
  const form = await request.formData();
  // create/update/delete entity
  return { ok: true };
}

export default function KeyRoute() {
  // useLoaderData(), useActionData() available from react-router
  return <div>Key details</div>;
}
```
> If you use loaders/actions, deploy with a Node server (see **Deployment**).

## Building for Production
```bash
npm run build
```
The build output lives in `build/`:
```
build/
  client/   # Static assets
  server/   # SSR/server code
```

## Deployment
### Docker Deployment
**Dockerfile (example):**
```dockerfile
# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run stage ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
# copy any runtime assets if needed (e.g., public)
COPY public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
```
Build and run:
```bash
docker build -t keycliq .
docker run -p 3000:3000 --env-file .env keycliq
```
Deploy to any container platform (ECS, Cloud Run, Azure Container Apps, Fly.io, Railway, DO App Platform, etc.).

### DIY Deployment
If you’re deploying a Node app yourself:
1. Ensure environment variables are configured on the host.
2. Build on CI or the server: `npm ci && npm run build`.
3. Start the app server: `npm run start` (runs `react-router start`).
4. Serve behind a reverse proxy (Caddy/Nginx) if desired.

## Styling
Tailwind CSS is preconfigured. Use any styling approach you prefer.

## Testing
- **Unit/Component:** Vitest + @testing-library/react
- **E2E (optional):** Playwright

## Troubleshooting
**404 on `/test`:**
- If `app/routes.js` exists, you must **explicitly register** `{ path: "test", file: "routes/test.jsx" }`.
- Ensure the route module has a **default export** component.
- Restart the dev server after adding new files.

**`No matching export` from `react-router-dom`/`react-router`:**
- Version mismatch. Align the pair:
  ```bash
  npm i -E react-router@latest react-router-dom@latest
  rm -rf node_modules package-lock.json && npm i
  ```

**Port or host issues:**
- Dev server is `http://localhost:5173`. Use `--host` to expose on LAN.

## Contributing
- Feature branches + PRs
- Conventional commits recommended (`feat:`, `fix:`, `docs:`, …)
- Keep docs/tests updated with user‑facing changes

## License
**Proprietary / Private** — © REBL. All rights reserved.

