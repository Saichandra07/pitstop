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

## Google Maps dir_action=navigate is mobile-only (2026-05-06)

**Observation**: On desktop/laptop, `dir_action=navigate` has no effect — Google Maps shows the route preview screen. On mobile with Google Maps installed, it opens directly in turn-by-turn navigation. This is correct and expected behaviour — mechanics use phones, not laptops.

**Rule**: Do not test navigation-specific URLs on desktop and expect the same experience as mobile.
