# Lessons Learned — PitStop

## Broadcast Lifecycle — Scheduler Ring Count Bug (2026-05-06)

**What went wrong**: After `mechanicAbandon()`, the job's `broadcastRing` was reset to 1 and `broadcastStartedAt` set to now. But the old ACCEPTED broadcast row (from when the mechanic originally accepted) still had `ring = 1`. The scheduler's "ring was empty → advance" check used `countByJobIdAndRing` which counts ALL broadcasts ever for that ring — including the old ACCEPTED one. So `totalInRing = 1`, `sentCount = 0` → condition to advance was never true → ring stuck at 1 forever.

**Fix**: Added `countByJobIdAndRingAndSentAtGreaterThanEqual(jobId, ring, broadcastStartedAt)` to only count broadcasts from the current lifecycle. Old records are invisible to this count.

**Rule**: Any time a job can be "restarted" (abandon, reassign, etc.), scheduler counts MUST be scoped to the current lifecycle using `broadcastStartedAt` as the cutoff — never use all-time counts for ring-state decisions.

---

## getPendingJobs Had No Broadcast History Filter (2026-05-06)

**What went wrong**: `JobService.getPendingJobs()` returned all PENDING jobs matching a mechanic's expertise — no check for whether the mechanic had already received a broadcast for that job. After a mechanic abandoned a job, the job went back to PENDING. The mechanic went back online → `notifyNewlyOnlineMechanic` correctly excluded them (NOT EXISTS on broadcast table). BUT the `/api/jobs/pending` feed still showed the job because it only filtered by expertise, not broadcast history.

**Fix**: Added `.filter(job -> !jobBroadcastRepository.existsByJobIdAndMechanicProfileId(job.getId(), profile.getId()))` to exclude any job the mechanic has ever received a broadcast for.

**Rule**: Any "available jobs" feed for mechanics must always exclude jobs the mechanic already has a broadcast record for — regardless of broadcast status.

---

## ProfilePage Showed "Offline" Mid-Job (2026-05-06)

**What went wrong**: `ProfilePage` used `profile?.isAvailable ? "Online" : "Offline"` for the mechanic's "Now" stat. But when a mechanic accepts a job, the backend sets `isAvailable = false` (mechanic is auto-taken offline). So the profile always showed "Offline" during an active job.

**Fix**: Fetch `/jobs/mechanic/active` in ProfilePage. If active job exists → show "On Job". Otherwise use `isAvailable` for Online/Offline.

**Rule**: `isAvailable = false` does NOT always mean "Offline" for a mechanic. It can mean "On Job". Always check for an active job before rendering availability status.

---

## User-Cancel Glitch on Mechanic Side (2026-05-06)

**What went wrong**: When a user cancelled a job mid-way, the mechanic's active job disappeared from the 5s poll. `hasActiveJob` became false, `isOnline = me.isAvailable = false` (still false from when job was accepted). The UI silently switched to "Offline" state with a dim map overlay — no explanation to the mechanic.

**Partial fix applied**: Added `prevActiveJobRef` and `expectingJobEndRef` to detect when job disappears without mechanic action. Shows snackbar: "User cancelled the request. Go online for new jobs."

**Still needed (next session)**: Show a dedicated overlay instead of a snackbar. The mechanic needs a single "Go Online Again" button — finding the toggle themselves is too much friction.

**Rule**: Any time external state forces a UI transition (job cancelled by someone else, broadcast expired, etc.), always explain what happened with a visible message — never let the UI silently glitch.

---

## React.lazy import must be before other imports (2026-05-06)

**What went wrong**: Putting `const NavigationMap = lazy(...)` after the import block caused a lint warning and potential runtime issues. Dynamic imports via `lazy()` must be at the top level, outside components, and ideally grouped near the top of the file.

**Rule**: All `React.lazy()` calls go at the module top level, right after static imports.

---

## Per-route Context Providers reset state on navigation (2026-05-07)

**What went wrong**: Each mechanic route had its own `<BroadcastProvider>` wrapper. Navigating from Dashboard to History unmounted the Dashboard's provider instance and mounted a fresh one — resetting all polling refs. Within 5 seconds, the new poll returned broadcasts, `prevCountRef.current` was 0 (fresh mount), so the overlay auto-expanded on every navigation without user interaction.

**Fix**: Lift the single `<BroadcastProvider>` to wrap all `<Routes>` in `App.jsx`. One instance for the entire session — state never resets on navigation.

**Rule**: Any Context that holds state which must survive page navigation must be mounted ABOVE the router's route-switching layer, not inside individual routes.

---

## Cancel detection false positive when mechanic goes offline (2026-05-07)

**What went wrong**: The broadcast cancel detection loop checks: "if a broadcast ID was in our tracking refs last poll but isn't now, and the mechanic didn't act on it → user cancelled." When the mechanic toggled offline, the backend correctly returned an empty list (offline guard). But the detection loop saw the missing ID and fired `setBroadcastCancelledByUser(true)` — showing a false "Request Withdrawn" card.

**Fix**: Added `clearBroadcastTracking()` to BroadcastContext. Called it in MechanicDashboardPage right before going offline, so the refs are empty before the next empty poll arrives. Nothing to compare → no false positive.

**Rule**: Cancel detection that relies on "ID disappeared from list" must distinguish between "user cancelled" and "mechanic went offline." Explicitly clear tracking state on any mechanic-initiated state change that will cause the list to go empty.

---

## Frontend timer should anchor to server sentAt, not Date.now() (2026-05-07)

**What went wrong**: The 90-second SOS response timer used `Date.now()` as the `receivedAt` timestamp when a broadcast first appeared in the frontend. If the mechanic went offline and back online (or the context re-mounted), a fresh `Date.now()` was assigned — resetting the timer to 90 seconds even if 70 seconds had already elapsed since the broadcast was sent.

**Fix**: Use `new Date(b.sentAt).getTime()` as the fallback (server's broadcast creation timestamp). The timer now counts down from when the broadcast was created, not when the frontend first saw it — surviving any amount of client-side state loss.

**Rule**: Countdown timers that have a fixed server-side deadline must always anchor to a server-provided timestamp. Never use `Date.now()` as a substitute — it creates a fresh window every time the client loses and regains state.

---

## DTO field name mismatch silently breaks all admin actions (2026-05-07)

**What went wrong**: `AdminMechanicResponse` record had a field named `mechanicProfileId`. The admin panel's Mechanics tab used `m.id` everywhere (expand toggle, suspend, unsuspend, delete). `m.id` resolved to `undefined` because the record has no `id` field. All API calls went to `/admin/mechanics/undefined/unsuspend` etc. — silently 404-ing or 500-ing with no visible error to the admin.

**Fix**: Replaced all `m.id` in the Mechanics tab section with `m.mechanicProfileId`. The VerifyTab's `m.id` was left alone — `MechanicPendingResponse` correctly has an `id` field there.

**Rule**: When you define a DTO record, always check what field names the frontend will use. Mismatched names between backend DTO and frontend access pattern is invisible until you test the specific action — the UI renders fine, buttons look correct, but nothing works. Always verify DTO field names against frontend usage after any backend DTO change.

---

## Leftover state references after refactoring cause silent runtime errors (2026-05-07)

**What went wrong**: After the big refactor that removed `pendingBroadcast` state from MechanicDashboardPage, one line was left behind: `else setPendingBroadcast(null)` in `handleToggleAvailability`. Since `setPendingBroadcast` was no longer declared, it was a `ReferenceError`. This was inside a `try/catch` block — the error was silently swallowed and showed "Something went wrong" to the mechanic every time they went offline.

**Fix**: Replaced with `clearBroadcastTracking()` which is the correct replacement behavior anyway.

**Rule**: After removing a piece of state from a component, grep the entire file for the setter name (`set<StateName>`) and confirm there are zero remaining references. Setters left behind are ReferenceErrors wrapped in try/catch — they look like mysterious "Something went wrong" errors at runtime.

---

## Fixed-bottom card DOM order: summary strip must be FIRST (2026-05-07)

**What went wrong**: `ActiveJobFloat` had expanded details FIRST in DOM and the summary strip LAST. The card uses `position: fixed; bottom: 56px` with `overflow: hidden` + `maxHeight`. Content flows from the TOP of the container. When minimized to `maxHeight: 72px`, only the top 72px of DOM content is visible — which was the ring block header, not the summary strip. The summary strip (last in DOM) was clipped and invisible in the minimized state.

**Fix**: Moved summary strip to be FIRST in DOM. Now when minimized, the 72px summary strip fills the entire card. Details section is second, with its own `maxHeight: 0 → 240px` transition. The outer card has no max-height — it grows naturally as details expand.

**Rule**: For a `position: fixed; bottom: X` card with `overflow: hidden`, the element you want visible when the card is collapsed (PEEK state) must be FIRST in the DOM. The card grows upward, and overflow clips from whatever would fall below the max-height boundary. First = top = always visible. Last = bottom = first to be clipped.

---

## WebSocket Subscriptions Silently Lost After Reconnect (2026-05-11)

**What went wrong**: `WebSocketContext` used a `pendingRef` array for subscriptions queued before the first connect. On `onConnect`, pending subs were applied and `pendingRef` was drained to empty. If the WS connection dropped and reconnected, `onConnect` ran again — but `pendingRef` was now empty, so nothing was re-subscribed. All subscriptions were silently gone. The mechanic could go 30 seconds without receiving any broadcast notification (fallback poll interval) even though the connection looked healthy.

**Fix**: Replaced `pendingRef` with `registeredRef` — a permanent list of all desired `{ destination, callback }` pairs. `onConnect` now iterates `registeredRef` (not `pendingRef`) and re-subscribes everything on every connect and reconnect. The `activeRef` (live STOMP sub handles) is cleared and rebuilt fresh each `onConnect`.

**Rule**: Any WS subscription manager must keep a permanent registry of desired subscriptions and replay the entire registry on every `onConnect` — not just the initial connect. Draining the queue after first connect and never re-filling it means reconnects always start with no subscriptions.

---

## SockJS + Vite = Blank White Page (2026-05-11)

**What went wrong**: `sockjs-client` is a CommonJS module. Vite's native ESM bundler cannot handle it at runtime — the `SockJS` constructor fails, crashes the module, and the entire React app shows a blank white page with a console error like "SockJS is not a constructor."

**Fix**: Removed `sockjs-client` entirely. Removed `.withSockJS()` from `WebSocketConfig.java`. Switched the frontend to `brokerURL: "ws://localhost:8080/ws"` (native WebSocket, supported natively by `@stomp/stompjs` v7). Spring Boot handles native WebSocket without SockJS — only the `registerStompEndpoints` line changes.

**Rule**: Never use `sockjs-client` with Vite. If you need SockJS for older browser support, you would need to add it as a Vite exclude and handle it as a UMD global — but for this stack, native WebSocket is sufficient and far simpler.

---

## WS Publish Inside @Transactional Fires Before DB Commit (2026-05-11)

**What went wrong**: `SimpMessagingTemplate.convertAndSend()` called directly inside a `@Transactional` method fires the WS message before the transaction commits. The mechanic's frontend receives the event, immediately calls `poll()`, and the REST endpoint returns the old data (transaction not yet committed). The mechanic sees no change, waits for the next WS event or 30s fallback.

**Fix**: `afterCommitOrNow()` helper in `WebSocketEventPublisher`. It checks `TransactionSynchronizationManager.isActualTransactionActive()`. If inside a transaction, registers an `afterCommit` callback (fires after commit). If outside, runs immediately. All `publishJobUpdate` and `publishBroadcast` calls go through this helper.

**Rule**: Never call `SimpMessagingTemplate.convertAndSend()` directly inside a `@Transactional` method. Always defer it to `afterCommit()` so the DB write is visible to any reader that immediately polls after receiving the WS event.

---

## cancelJobOnLogout Had No WS Events (2026-05-11)

**What went wrong**: When a user logged out mid-job, `AuthContext.logout()` just cleared localStorage. The backend had `cancelJobOnLogout()` in `JobService` but it was never called (no endpoint). Even after wiring it to `/auth/logout`, it cancelled the job silently with zero WS events — mechanics waited up to 30s to see the state change.

**Fix**: Three changes together: (1) Added WS event logic to `cancelJobOnLogout()` — same pattern as `cancelJob()`, pinging assigned mechanic or all SENT broadcast mechanics. (2) Added `POST /api/jobs/logout` endpoint. (3) Made `AuthContext.logout()` async — calls the backend endpoint BEFORE clearing localStorage so the JWT is still valid when the backend fires WS events.

**Rule**: Any logout path that can leave an active job behind must cancel it AND fire WS events before the token is cleared. The order is critical: API call (with valid JWT) → backend cancels + fires WS → frontend clears token.

---

## IDOR Fix Can Break Existing Frontend Fallback Calls (2026-05-13)

**What went wrong**: Restricting `GET /api/jobs/*` to ADMIN-only (IDOR fix B2) broke a fallback call in `ActiveJobContext.jsx` — on job end, it called `api.get('/jobs/${prevId}')` to determine whether the job was cancelled or completed. Once the IDOR rule was in place, this call would return 403 for regular users forever.

**Fix**: Removed the fallback API call entirely. Replaced with a deterministic status-based heuristic — if the last known status was `COMPLETION_REQUESTED` or `IN_PROGRESS`, treat it as completed; otherwise cancelled. WebSocket makes the fallback nearly redundant anyway.

**Rule**: Before restricting any endpoint, grep the entire frontend for every URL pattern that matches. A route that looks "generic admin-only" might have a frontend path that depends on it for a specific user flow. Always trace usage before restricting.

---

## Timeout Values Need Product Judgment, Not Just Technical Correctness (2026-05-13)

**What went wrong**: Set `sosTimeoutUntil = now.plusHours(24)` for the 3rd+ pre-acceptance cancel. Pre-acceptance cancels are considered "free" cancels by design (no mechanic has committed yet). A 24-hour block is appropriate for post-acceptance cancels but is too harsh for pre-acceptance.

**Fix**: Changed to `plusHours(1)` — enough friction to stop spam loops without punishing users who genuinely change their mind.

**Rule**: Rate-limit and timeout values are product decisions, not just technical ones. Always ask: "Is this sanction proportional to the severity of the abuse?" For "free" actions (pre-acceptance cancel), 1 hour is appropriate. For committed actions (abandoning mid-repair), 24 hours or longer is justified.

---

## Lifetime Counter Never Resets — sosCancelCount Bug (2026-05-14)

**What went wrong**: `sosCancelCount` incremented on every PENDING cancel and was never reset. The
timeout was applied at count >= 3, but the count stayed >= 3 forever. After the first 1-hour block
lifted, the very next PENDING cancel (count now 4, still >= 3) immediately blocked again — permanently.
The comment even said "3+ within the window" but there was no window at all.

**Root cause (also wrong)**: Pre-acceptance cancels should not be penalised at all per the original
spec. The counter was tracking the wrong event entirely — PENDING cancels are free actions. The real
abuse is cancelling after a mechanic has already accepted and committed to driving.

**Fix (next session)**: Remove the `wasPending` counter block entirely. Add a `wasAccepted` block
instead — only penalise post-acceptance cancels. Reset count to 0 when applying each timeout so
it operates as "N per window" not "N lifetime."

**Rule**: Any counter used for rate-limiting must always have a reset path. If you apply a timeout,
reset the counter to 0 at the same time so the next window starts clean. Also: before adding a
penalty, ask whether the action being counted is actually the abusive one — not just a related one.

---

## Google Maps dir_action=navigate is mobile-only (2026-05-06)

**Observation**: On desktop/laptop, `dir_action=navigate` has no effect — Google Maps shows the route preview screen. On mobile with Google Maps installed, it opens directly in turn-by-turn navigation. This is correct and expected behaviour — mechanics use phones, not laptops.

**Rule**: Do not test navigation-specific URLs on desktop and expect the same experience as mobile.

---

## isAvailable=false During Active Job Silently Pauses Location Interval (2026-05-14)

**What went wrong**: The mechanic's GPS update `useEffect` had guard `if (!me?.isAvailable) return;` and dependency `[me?.isAvailable]`. When a mechanic accepts a job, the backend sets `isAvailable = false` (mechanic is taken offline). This triggered the useEffect — guard evaluated to `true` — interval was cleared. Mechanic's DB coords froze at accept-time, so the user's "~X km away" display would show a stale distance even as the mechanic drove.

**Fix (frontend)**: Changed guard to `if (!me?.isAvailable && !activeJob) return;` and dependency to `[me?.isAvailable, !!activeJob]`. Interval now fires when EITHER the mechanic is online OR there is an active job.

**Fix (backend)**: The `updateMechanicLocation()` method originally had `if (!Boolean.TRUE.equals(profile.getIsAvailable())) return;` — this blocked the update during the job. Removed the guard entirely. The endpoint is MECHANIC-JWT-only, so the frontend controls when to call it; the backend doesn't need a secondary availability check.

**Rule**: `isAvailable = false` for a mechanic has two different meanings — "offline" and "on a job." Never write `if (!isAvailable) skip` for any operation that should also run during active jobs. Always check for `activeJob` as a second condition.

---

## Axios Uses XHR — window.fetch Interception Does Nothing (2026-05-14)

**What went wrong**: Puppeteer script tried to intercept API calls by overriding `window.fetch`. The app uses Axios, which uses `XMLHttpRequest` under the hood — not the Fetch API. The interception had no effect; all calls went through normally.

**Fix**: Intercepted `XMLHttpRequest.prototype.open` and `XMLHttpRequest.prototype.send` instead.

**Rule**: Before intercepting HTTP calls in browser automation, check what HTTP library the app uses. Axios → XHR interception. Native fetch or `ky` → `window.fetch` interception. Mixing them up results in silent no-ops.

---

## Always Explain Before Deleting Files — Even "Dead" Code (2026-05-15)

**What went wrong**: Deleted `MechanicTag.java`, `Appeal.java`, and `Notification.java` as part of dead code cleanup (C1). User immediately questioned whether `MechanicTag.java` deletion would break the review tag system.

**Root cause**: Deleted without first explaining what each file was connected to (or not connected to). Even though the files were confirmed unused by grep, the user had no way of knowing that tags are stored as a comma-separated string in `Review.java` — not in `MechanicTag.java`. The name "MechanicTag" sounds critical.

**Fix**: After user asked, explained that `Review.tags` (comma-separated string in the existing entity) is the live tags system; `MechanicTag.java` was an orphaned table from an early design that was never wired to any repository, service, or controller.

**Rule**: Before deleting any file — even one confirmed unused by grep — briefly explain: (1) what it was originally intended for, (2) what the live replacement is, (3) confirm nothing visible to users is affected. One sentence of explanation prevents alarm. "I'm deleting X — its job is now handled by Y, grep confirms zero usages" is enough.

---

## Component Returning null Silently Kills the Snackbar (2026-05-16)

**What went wrong**: `ActiveJobFloat` returns `null` when `activeJob` is null — which is exactly when the mechanic's "user cancelled" snackbar fires. The snackbar is set in `ActiveJobContext`, then on the next render `activeJob` is null, the component unmounts, and the snackbar is never shown. The mechanic sees nothing — no explanation, no message.

**Fix**: Changed the early return to: if `activeJob` is null but a `snackbar` exists, render only the floating snackbar div instead of returning null outright. The snackbar auto-dismisses after 3 seconds, then the component fully returns null.

**Rule**: Never put a critical notification (snackbar, toast, error) inside a component that will immediately unmount due to the same state change that triggered the notification. Always render the notification even on the "nothing to show" path. Either render it as a minimal stub or lift it to a parent that doesn't unmount.

---

## findEligiblePendingJobsForMechanic Filters SENT+DECLINED but NOT ACCEPTED (2026-05-16)

**What went wrong**: After the escape hatch, the job was rebroadcasted to Ring 1. The escaped mechanic's original broadcast row still had status `ACCEPTED`. `findEligiblePendingJobsForMechanic` (used by `notifyNewlyOnlineMechanic`) filters `jb.status IN ('SENT', 'DECLINED')` — ACCEPTED is not in the list. So when the mechanic came back online, the job appeared eligible and they got rebroadcasted the same job they were just kicked off of.

**Fix**: After `rebroadcastJob`, call `declineAllForMechanicAndJob(jobId, originalMechanicProfileId)`. This updates the ACCEPTED row to DECLINED. Now `findEligiblePendingJobsForMechanic` correctly excludes the mechanic.

**Rule**: After any "forcible removal" from a job (escape hatch, admin action, etc.), always explicitly call `declineAllForMechanicAndJob` — don't rely on the existing broadcast status being enough. ACCEPTED rows are not filtered by the newly-online mechanic query.

---

## Competing Mechanics Need a Distinct WS Type When a Job Is Taken (2026-05-16)

**What went wrong**: When mechanic A accepted a job, mechanic B's broadcast was expired silently. Mechanic B had no WS event and waited for their next poll. When the poll fired, the broadcast was gone — the detection loop in `BroadcastContext.poll()` saw a missing ID without mechanic action and showed "SOS request was withdrawn by the user." This is factually wrong and bad UX.

**Fix**: In `BroadcastService.handleAccept()`, collect the list of competing mechanics (those with SENT broadcasts) BEFORE calling `expireAllSentForJobExcept`. After the accept logic, ping each competitor via `publishBroadcast(accountId, Map.of("type", "BROADCAST_TAKEN"))`. On the frontend, the WS subscription checks for this type, sets a suppress flag, shows a fun "Too slow!" message, then calls `poll()` with the flag set so the generic cancel snackbar is skipped.

**Rule**: Whenever a broadcast disappears due to another mechanic's action (not user cancel), always send a specific WS event type so the losing mechanic can show the right message. Generic "broadcast gone" detection cannot distinguish between "user cancelled" and "someone else was faster."

---

## Railway PostgreSQL Vars Are Not Auto-Shared (2026-05-17)

**What went wrong**: `application-prod.properties` referenced `${PGHOST}`, `${PGPORT}` etc. Railway provisions these vars on the PostgreSQL service — but they are NOT automatically injected into other services. Spring Boot received the literal string `${PGHOST}` and the JDBC driver failed with "invalid port number: ${PGPORT}".

**Fix**: In the Spring Boot service Variables tab, add reference variables using Railway syntax: `PGHOST=${{Postgres.PGHOST}}` (double curly braces, exact service name). Railway resolves these at deploy time.

**Rule**: On Railway, every inter-service variable must be explicitly wired using `${{ServiceName.VAR}}` reference syntax. Never assume env vars from one service auto-appear in another.

---

## Vite 8 Rolldown Has Import Resolution Bugs (2026-05-17)

**What went wrong**: `package.json` had `"vite": "^8.0.1"`. Vite 8 uses rolldown (new Rust bundler) instead of rollup. On Vercel's clean install, the build failed with `UNRESOLVED_IMPORT` for `./pages/SOSWizardPage` — a file that exists and is correctly cased. Worked locally because local `node_modules` had an older cached version.

**Fix**: Pinned Vite to `"^5.4.19"` and `@vitejs/plugin-react` to `"^4.3.4"` (compatible with Vite 5). Vite 5 uses rollup and is stable.

**Rule**: Do not use `^` with Vite when Vite's major version was just bumped. A new major (Vite 8) can introduce bundler-breaking changes. Pin to the last known-stable major until the new one is battle-tested.

---

## Untracked Files Can Contain Live Secrets (2026-05-17)

**What went wrong**: `firebase-service-account.json` sat untracked in `pitstop-backend/src/main/resources/`. It had a live Firebase private key for project `pitstop-7f2d3`. Firebase was removed in Session 9 but the file was never deleted. It was never committed — but was never gitignored either. It was invisible in normal git status unless you looked for untracked files explicitly.

**Fix**: Deleted the file, added `**/firebase-service-account.json` and `**/*-service-account.json` to both the root `.gitignore` and `pitstop-backend/.gitignore`. User deleted the Firebase project making the key permanently dead.

**Rule**: Before any deployment, always run a full grep for known secret file patterns (`service-account`, `.pem`, `credentials.json`, `.env`) in untracked files. Untracked ≠ safe — anyone with local repo access can read them, and they can accidentally end up in a zip or CI artifact.

---

## Synchronous HTTP Calls Inside a Toggle Block the Response (2026-05-14)

**What went wrong**: `GeocodingService.reverseGeocode()` was called synchronously inside `AccountService.toggleAvailability()` before `mechanicProfileRepository.save()`. Even with a 500ms timeout, the entire toggle API call waited for Nominatim to respond before returning to the frontend. The toggle felt sluggish.

**Fix**: Moved the geocoding call to `CompletableFuture.runAsync()` after the save. The toggle returns immediately; the area is written to the DB in the background ~200ms later. Used `mechanicProfileRepository.findById(profileId)` inside the async lambda to get a fresh managed entity for the update.

**Rule**: Any non-critical enrichment (reverse geocoding, analytics ping, notification dispatch) that doesn't affect the primary response should be async. Fire it after the save, not before. The user should never wait for a side-effect.
