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

## Google Maps dir_action=navigate is mobile-only (2026-05-06)

**Observation**: On desktop/laptop, `dir_action=navigate` has no effect — Google Maps shows the route preview screen. On mobile with Google Maps installed, it opens directly in turn-by-turn navigation. This is correct and expected behaviour — mechanics use phones, not laptops.

**Rule**: Do not test navigation-specific URLs on desktop and expect the same experience as mobile.
