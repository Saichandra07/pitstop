# Session 13 — Deploying PitStop to the Internet

**Date:** 2026-05-17
**What we did:** Deployed the PitStop app to production for the first time — backend on Railway, frontend on Vercel.

---

## What We Built / Changed

PitStop was working perfectly on localhost but it only ran on your own machine. The goal of this session was to put it on the internet so anyone with the URL can open it, create an account, and use the app — exactly like a real product.

We had a 4-phase plan:
1. Fix code that was hardcoded to `localhost`
2. Deploy the Spring Boot backend + PostgreSQL database to Railway (a cloud hosting service)
3. Deploy the React frontend to Vercel (another cloud hosting service)
4. Verify everything works end-to-end

We hit and fixed several blockers along the way — each one is explained below.

---

## Files Touched

**`pitstop-frontend/src/api/axios.js`**
This file is the "post office" for all HTTP requests from the frontend — every API call goes through it. It previously had `http://localhost:8080/api` baked in as the backend address. On Vercel, there is no localhost — the backend lives on Railway. We changed it to read from an environment variable called `VITE_API_BASE_URL`, with localhost as a fallback so local development still works. An environment variable is like a configuration setting you set per-environment (local, staging, production) without changing the code itself.

**`pitstop-frontend/src/context/WebSocketContext.jsx`**
This file manages the real-time WebSocket connection. It previously had `ws://localhost:8080/ws` hardcoded. We changed it to automatically derive the WebSocket URL from the same `VITE_API_BASE_URL` environment variable — replacing `https://` with `wss://` and removing `/api` from the end. This is important because browsers running on HTTPS (which Vercel uses) refuse to open a plain `ws://` connection — they require the encrypted `wss://` version. One env var now drives both REST and WebSocket.

**`pitstop-backend/src/main/resources/application-prod.properties`** (NEW)
Spring Boot supports "profiles" — think of them like switchable config files. We created a `prod` profile that reads all sensitive values (database host, JWT secret, email password) from environment variables. This means no secrets ever touch the code. On Railway, we set each env var in the dashboard. Railway then injects them when the app starts.

**`pitstop-frontend/.npmrc`** (NEW)
npm (the JavaScript package manager) has a strict rule: if a library says it only works with React 18, npm refuses to install it when React 19 is present. `react-leaflet` (our map library) had this restriction. A `.npmrc` file with `legacy-peer-deps=true` tells npm to be lenient about these version rules — install it anyway, just like it used to before npm got strict. This fixed Vercel's failed install.

**`pitstop-frontend/vercel.json`** (NEW)
React apps use "client-side routing" — the browser manages the URL without actually loading a new page from the server. When you refresh `pitstop-silk.vercel.app/login`, Vercel looks for a file literally called `login.html` — which doesn't exist. `vercel.json` with a rewrite rule (`"source": "/(.*)", "destination": "/index.html"`) tells Vercel: "for any URL, just serve `index.html` and let React handle it." Without this, every page refresh returned a 404.

**`pitstop-frontend/package.json`**
Vite is the build tool that turns our React code into files a browser can read. Vite just released version 8, which uses a brand-new Rust-based bundler called rolldown (replacing the old rollup). Rolldown had a bug where it couldn't resolve a perfectly valid import. We pinned Vite back to version 5 (`^5.4.19`) — the battle-tested stable version — to avoid this bug. Also downgraded `@vitejs/plugin-react` to version 4 which is compatible with Vite 5.

**Root `.gitignore` + `pitstop-backend/.gitignore`**
During a security sweep before deployment, we found `firebase-service-account.json` sitting untracked in the backend resources folder. It contained a live Firebase private key — a credential that could let anyone control the Firebase project. Firebase was removed from the app in Session 9 but the file was never deleted. We deleted it, added patterns to both `.gitignore` files to block it permanently, and the user deleted the Firebase project entirely so the key is now dead. Untracked means git doesn't commit it — but it was still sitting on disk and could end up in a zip, a Docker image, or a CI artifact.

---

## How It All Connects

Think of the deployment like opening a restaurant. Before, you were cooking in your kitchen (localhost). Now you're opening a real location that customers can visit.

The **backend** (Spring Boot + PostgreSQL) is like the kitchen and storage — Railway is the building it lives in. Railway gives the kitchen a real address on the internet (`pitstop-production-a67e.up.railway.app`).

The **frontend** (React) is the dining room and menu — Vercel is the building it lives in. Vercel gives it a real address too (`pitstop-silk.vercel.app`). When a customer (browser) opens that URL, Vercel serves the menu (React app).

When a customer places an order (makes an API call), the React app sends it to the Railway backend address. The backend checks the PostgreSQL database (also on Railway), processes the order, and sends back a response. WebSocket is like the waiter who continuously updates the customer's table in real-time without them having to ask again.

The environment variable `VITE_API_BASE_URL` is how the dining room knows where the kitchen is. Set it correctly, and everything connects.

---

## Bugs We Hit

**Railway PostgreSQL variables not shared between services**
Railway automatically creates environment variables like `PGHOST` and `PGDATABASE` for its PostgreSQL service. But it does NOT automatically share those with other services. Our Spring Boot app received the literal text `${PGHOST}` (the placeholder) instead of the actual value, and the JDBC driver rejected it with "invalid port number: ${PGPORT}". Fix: use Railway's reference variable syntax — `PGHOST=${{Postgres.PGHOST}}` — in the Spring Boot service's Variables tab. Railway resolves these at deploy time.

**Vite 8 rolldown UNRESOLVED_IMPORT**
Vite 8 shipped its brand-new bundler (rolldown) but it had an import resolution bug that prevented it from finding `SOSWizardPage.jsx` — a file that exists, is correctly named, and worked fine locally. Worked locally because local `node_modules` had an older Vite version cached. Fix: pin Vite back to `^5.4.19`.

**Registration returning 500 (SMTP failure)**
When a new user registers, the backend saves their account and immediately sends a verification email via Gmail SMTP. The `MAIL_PASSWORD` in Railway was set to the Gmail account's login password. Gmail does not allow direct login passwords in SMTP connections — it requires a 16-character "App Password" generated from Google Account → Security → 2-Step Verification → App Passwords. The wrong password caused the email send to throw an exception, which became a 500 response to the frontend. Fix: set `MAIL_PASSWORD` to the correct App Password.

**React Router 404 on page refresh**
After registering, the app navigates to `/verify-email`. Reloading that URL asked Vercel for a file called `verify-email.html` — which doesn't exist. Vercel returned 404. Fix: `vercel.json` rewrite rule directs all paths to `index.html`.

---

## New Concepts

**Environment Variables** — A way to configure an app without hardcoding values in the code. Think of it as a settings panel you can change per-environment. On Railway, you set them in the Variables tab. On Vercel, in the Environment Variables section. In code, you read them with `import.meta.env.VITE_*` (frontend) or `${PLACEHOLDER}` in `.properties` files (backend).

**Spring Boot Profiles** — Spring Boot can have multiple config files: `application.properties` (default), `application-dev.properties`, `application-prod.properties`. Setting `SPRING_PROFILES_ACTIVE=prod` makes the app load the prod config on top of the default. This lets you have different database URLs, log levels, and feature flags per environment without changing code.

**Peer Dependencies** — When a library says "I require React 18," that's a peer dependency declaration. npm enforces this — if you have React 19, it refuses to install. `legacy-peer-deps=true` tells npm to ignore these version warnings and install anyway. Most libraries work across versions even if they don't declare it — the strict requirement is often just out of date.

**Railway Reference Variables** — Railway's way of sharing values between services. `${{ServiceName.VAR}}` is resolved by Railway before the app starts. Without this, services are isolated — each service only sees the env vars you explicitly define for it.

**SPA Routing** — Single-page apps manage URLs in the browser using JavaScript, not actual files on the server. When you go to `/dashboard`, the server needs to return `index.html` for all paths and let React figure out what to show. If the server tries to find a real file for each path, it returns 404 for everything except the root. `vercel.json` rewrites fix this by making Vercel always serve `index.html` regardless of the URL path.

**Google App Passwords** — Gmail blocked direct password logins for SMTP a few years ago (for security). Instead, you generate a specific 16-character "App Password" from your Google Account for a specific application. This is what `MAIL_PASSWORD` must be — not your Gmail login password.

**Rolldown** — The new Rust-based module bundler inside Vite 8. Bundling is the process of taking hundreds of JavaScript files and combining them into a few optimised files the browser can download quickly. Rolldown is faster than the old rollup bundler but was still in early release with known bugs. Pinning to Vite 5 uses the stable rollup bundler instead.
