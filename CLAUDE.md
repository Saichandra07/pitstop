# PitStop — Claude Code Workspace

## Project
On-demand roadside mechanic app (Swiggy for breakdowns).
React + Vite frontend, Spring Boot backend, PostgreSQL.
Portfolio flagship — must be production quality end to end.

---

## Session Ritual (MANDATORY — every session)
Read these files in order before writing any code:
1. Spec.md   — product bible, design system, all rules
2. Done.md   — what is built
3. Stack.md  — structure, component props, hard rules
4. Today.md  — current session plan

Confirm understanding. Wait for approval before starting.

---

## Current State (2026-05-17 — Session 13 In Progress)
Session 13 executed the full deployment plan. Backend is LIVE on Railway at pitstop-production-a67e.up.railway.app (Spring Boot + PostgreSQL, prod profile active, WebSocket running). Frontend is deploying to pitstop-silk.vercel.app on Vercel. Major blockers hit and resolved: firebase-service-account.json with live key found in untracked files (deleted, gitignored, Firebase project deleted by user); Railway PostgreSQL vars needed reference variable syntax (${{Postgres.PGHOST}} etc.); react-leaflet peer dep conflict fixed with .npmrc; Vite 8 rolldown import resolution bug fixed by pinning to Vite 5; vercel.json added for React Router SPA routing. Registration 500 error traced to wrong MAIL_PASSWORD (login password instead of Google App Password) — user corrected it. Final Vite v5 deploy triggered via deploy hook — pending completion. Next: verify registration + email flow end-to-end, then test WebSocket and full broadcast flow.

---

## Working Style
- One file / one feature at a time — no info dumps
- Use Plan Mode for ANY change touching more than one file — write plan first, wait for approval
- If something breaks or goes sideways: STOP, re-plan, don't keep pushing
- Never mark a task complete without proving it works end to end
- After any correction from user: update `tasks/lessons.md` with what went wrong and how to avoid it next time
- Review `tasks/lessons.md` at session start to avoid repeating mistakes

---

## Hard Rules
- NEVER hardcode secrets — DB_PASSWORD + MAIL_PASSWORD via IntelliJ env vars only
- NEVER return raw entities — always DTOs
- NEVER write inline duplicates of components in src/components/
- userId always from JWT, never from request body
- Feature is DONE only when backend + frontend both work end to end
- CSS vars only — never hardcode hex colors
- CSS vars do NOT resolve in backgroundImage — use rgba() directly there
- application.properties is gitignored — never committed
- Every change must be as simple as possible — only touch what is necessary, avoid introducing new bugs
- No hacky fixes — find the root cause every time

---

## Design System
Iron Man theme. Reference: IronMan_theme_mockup_for_pitstop.html
--bg #0A0A0F  --red #E63946  --gold #FFB700  --green #4ADE80
--surface #111118  --surface2 #1A1A24  --surface3 #22222F
--text #F0F0F0  --text-2 #9090A8  --text-3 #55556A  --border #2A2A3A

---

## Component Rule (MANDATORY)
Every page MUST use src/components/. Read Stack.md props before writing any page.
NEVER inline: TopBar, BottomNav, Avatar, JobCard, Badge,
BottomSheet, PitStopLogo, StatGrid, OptionCard, ProgressBar, WallScreen

---

## Spring Boot Gotchas (never repeat)
- @Table("users") is reserved — avoid
- @Enumerated(STRING) always
- @Lazy on JwtFilter
- SecurityConfig must be in main package
- RegisterRequest is a Java record — use .role() not .getRole()
- MechanicProfile.serviceRadiusKm is Double not Integer
- JwtUtil.generateToken(String email, Long accountId, Role role)
- @EnableScheduling required on main class for @Scheduled to work
- Table names are PLURAL: accounts, jobs (not account, job) — always check @Table annotation before writing raw SQL

---

## Next Session Priority (Today.md)
Always read Today.md — it is the single source of what is next.

---

## Session End Protocol
When the user says "end session" or "wrap up session":

1. **Update `Done.md`** — append what was completed this session under the correct step heading
2. **Rewrite `Today.md` from scratch** — REMOVE every priority that was completed today, KEEP only what is genuinely still pending, ADD any new priorities discovered. Today.md must never grow stale — it should always be a short, current list of only what is next, not a graveyard of done work.
3. **Update `CLAUDE.md` Current State** — one short paragraph reflecting the latest completed work
4. Update `tasks/lessons.md` if any mistakes or corrections happened
5. Create `session-log-YYYY-MM-DD.md` inside `/learning-docs` folder
6. **Give a git commit message** covering everything done this session so the user can push to GitHub

The learning doc must be written for an absolute beginner who is also preparing for technical interviews. Cover everything done this session:

1. **What we built / changed** — what is the feature and why does the app need it
2. **Files touched** — for each file, one short paragraph: what this file does, what we added/changed in it and why
3. **How it connects** — how these files/pages talk to each other to make the feature work — Explain the connection like a story or a relay race — who passes what to whom and why — before using any technical names.

4. **Bugs we hit** — what went wrong, why it happened, how we fixed it
5. **New concepts** — any new term or concept, explained in simple words first, then the technical name

Style rules:
- Write like a senior developer explaining to a beginner friend, not a system log
- Use simple analogies where possible
- Keep each section a clear short paragraph, not bullet dumps
- In the Files Touched section — introduce every technical term in plain English before using it. Never assume the reader knows what a query, context, dto, or endpoint means
- Good enough that I can read this and explain the feature in a technical interview