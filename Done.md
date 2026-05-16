# PitStop — What's Done

## Foundation
- ✅ Mechanic CRUD + Auth (superseded by unified account)
- ✅ User CRUD + Auth (superseded by unified account)
- ✅ Job CRUD
- ✅ JWT (BCrypt + JwtUtil + JwtFilter + SecurityConfig)
- ✅ React Login / Register / Dashboard / ProtectedRoute
- ✅ SOS Request — POST /api/jobs/sos, GPS capture, VehicleType + ProblemType enums

---

## S1 — Unified Account System ✅
## S2 — Backend Hardening ✅
## S3 — Frontend ✅
## Step 1+2 — Cleanup & Schema Migration ✅
## Step 3 — Admin Setup Endpoint ✅
## Step 4 — Basic Admin Panel ✅
## Step 5 — Mechanic Expertise System ✅
## Step 6 — GET /api/accounts/me ✅
## Step 7 — Forgot Password + Email Verification ✅
## Step 8 — Full UI Overhaul ✅
## Step 9 — SOS Wizard ✅

---

## Step 8.5 — UI Alignment + Component Extraction ✅

### Components extracted ✅ (all in src/components/)
- ✅ PitStopLogo.jsx — variant=auth/topbar
- ✅ TopBar.jsx — logo+center+right+optional back button
- ✅ BottomNav.jsx — role=user/mechanic, active tab, SVG icons
- ✅ Badge.jsx — variant=red/gold/green/dim/live
- ✅ Avatar.jsx — size=sm/md/lg, variant=red/gold/muted, onClick support
- ✅ JobCard.jsx — 52x52 icon, problem primary, vehicle secondary, date muted, status badge
- ✅ StatGrid.jsx — 2-col stats array
- ✅ OptionCard.jsx — icon+label+sublabel+selected
- ✅ BottomSheet.jsx — modal slide-up sheet
- ✅ WallScreen.jsx — centered icon+title+subtitle+children
- ✅ ProgressBar.jsx — step segments done/active/upcoming

### Pages fully rebuilt with components ✅
- ✅ LoginPage
- ✅ RegisterPage
- ✅ ForgotPasswordPage + ResetPasswordPage + VerifyEmailPage
- ✅ DashboardPage — components injected, HeartbeatMap, drag sheet, active job card
- ✅ MechanicDashboardPage — components injected, gold grid map, wall screens
- ✅ HistoryPage — components injected, JobCard, grouped by month, earnings card

### Global fixes ✅
- ✅ TopBar logo — hollow bolt, 34x34, red-soft bg, red border
- ✅ BottomNav — SVG icons, synced across user pages
- ✅ Avatar red — rounded square matching logo style
- ✅ App.jsx — RootRedirect for role-aware / routing
- ✅ axios.js — 401 interceptor skips public paths
- ✅ AuthContext — token+user persisted in localStorage

### Pages aligned ✅
- ✅ DashboardPage — compact strip (collapsed) + JobCard (expanded) + greeting pill
- ✅ SOSWizardPage — TopBar, OptionCard, ProgressBar injected
- ✅ VehicleOnboardingPage — TopBar, OptionCard, ProgressBar injected
- ✅ ProblemsOnboardingPage — TopBar, ProgressBar injected

### Pages aligned ✅ (continued)
- ✅ MechanicRegisterPage — PitStopLogo auth, ProgressBar, ps-auth-card, scrollbar fix
- ✅ AdminDashboardPage — JARVIS Operator redesign: 2px red top line, ItemCard left-bar, MiniStats strip, Slide collapse, TopBar + Badge + Avatar from components, --blue token added

---

## Step 10 — Cascading Broadcast ✅

### Backend ✅
- ✅ MechanicProfile — latitude + longitude (nullable Double), populated on toggle ON, nulled on toggle OFF
- ✅ AvailabilityRequest DTO — isAvailable + latitude + longitude (record)
- ✅ AccountService — saves lat/lng on toggle ON (400 if missing), nulls on toggle OFF
- ✅ AccountController — PATCH /api/accounts/availability accepts AvailabilityRequest body
- ✅ JobBroadcastStatus enum — SENT / DECLINED / ACCEPTED / EXPIRED
- ✅ JobBroadcast entity — tracks per-mechanic notification per ring (table: job_broadcast)
- ✅ JobBroadcastRepository — findByJobIdAndStatus, expireAllSentForJobExcept (bulk UPDATE), countByJobIdAndRingAndStatus
- ✅ MechanicProfileRepository — Haversine native SQL query: findEligibleMechanicsInRing (SQL-embedded, no PostGIS)
- ✅ BroadcastService — broadcastToRing, handleAccept, handleDecline, advanceOrTimeout; all @Transactional
- ✅ BroadcastScheduler — @Scheduled every 30s, advances stale rings (2-min timeout per ring), @ConditionalOnProperty guard
- ✅ Ring 1 fires immediately from JobService.createSosRequest() — no 30s wait for first broadcast
- ✅ JobResponseDto — added broadcastRing (Integer) field
- ✅ BroadcastJobResponse DTO — broadcastId, jobId, sentAt (server timestamp drives 90s mechanic timer)
- ✅ JobController — POST /{id}/accept, POST /{id}/decline, GET /broadcast/pending
- ✅ SecurityConfig — new MECHANIC routes: accept, decline, broadcast/pending
- ✅ PitstopBackendApplication — @EnableScheduling added

### Frontend ✅
- ✅ DashboardPage — 5s poll on PENDING, Ring X of 4 indicator (gold pulse dot), HeartbeatMap for PENDING / ActiveMap for ACCEPTED+IN_PROGRESS, height:auto active job sheet (no clipping), ActiveMap fake route removed
- ✅ MechanicDashboardPage — 5s broadcast poll when online+verified, JobRequestCard overlay (90s timer, red ≤30s, auto-decline on expiry, accept/decline buttons), geolocation captured at toggle ON
- ✅ SosWizardPage Step 3 — scroll fixed: fixed header + scrollable body (flex:1, overflowY:auto) + sticky footer
- ✅ pitstop.css — @keyframes psGoldPulse added

### Ring bands
Ring 1: 0–2 km · Ring 2: 2–5 km · Ring 3: 5–10 km · Ring 4: 10–20 km
2-minute timeout per ring via BroadcastScheduler. Ring 4 exhaustion → CANCELLED.

---

## Step 14 — ActiveJobFloat Redesign + Login/SOS UX Bug Fixes ✅

### Bug Fixes ✅
- ✅ `LoginPage` — `useEffect(() => { logout(); }, [])` on mount clears stale localStorage token; fixes "invalid credentials" in normal Chrome (worked in incognito only)
- ✅ `DashboardPage` — `idleSheetH = 0` when `hasActiveJob`; SOS sheet no longer renders behind the float
- ✅ `MechanicDashboardPage` — `currentSheetH = 0` when `hasActiveJob`; nearby requests no longer cluster with the float

### SOS Timing Gap Fix ✅
- ✅ `SOSWizardPage` — Full-screen loading overlay blocks all interaction during submission (no re-tap window)
- ✅ `SOSWizardPage` — `await refetchActiveJob()` before `navigate("/dashboard")` so float appears the instant dashboard loads
- ✅ `SOSWizardPage` — `useEffect` guard redirects back to `/dashboard` if `activeJob` is ever set while on the wizard

### ActiveJobFloat Complete Redesign ✅
- ✅ DOM order fixed: summary strip FIRST (always visible as 72px peek), expandable details SECOND (slides open below)
- ✅ Details have own `maxHeight: 0 → 240px` transition; outer card grows naturally with no max-height constraint
- ✅ Duplicate vehicle row removed from expanded details (summary strip already shows it)
- ✅ Summary strip subtitle: `Ring X/4 · VehicleType · VehicleName` for PENDING — ring info never truncated
- ✅ Subtitle has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- ✅ `borderBottom` separator on summary strip only when expanded; accent `borderTop` on outer card always
- ✅ Chevron: down when collapsed (tap to expand), up when expanded (tap to collapse)

---

## Step 13 — Global Broadcast Overlay + Mechanic Abandon Redesign + Bug Fixes ✅

### Mechanic Abandon Redesign (Backend) ✅
- ✅ `AbandonResponse` DTO — `showOffer`, `jobId`, `problemType`, `vehicleType`, `vehicleName`, `area`
- ✅ `BroadcastService.mechanicAbandon()` — now returns `AbandonResponse`; detects second-abandon via ACCEPTED broadcast count; suspends mechanic for the day on second abandon (`suspensionEndsAt = midnight`, `verificationStatus = SUSPENDED`)
- ✅ `BroadcastService.mechanicTakeBack()` — re-assigns job if still PENDING (409 if taken); creates second ACCEPTED broadcast row; takes mechanic offline
- ✅ `BroadcastService.mechanicMoveOn()` — marks mechanic's broadcast DECLINED (permanent block); calls `notifyNewlyOnlineMechanic` so nearby jobs appear
- ✅ `BroadcastService.getPendingBroadcast()` — returns `List<BroadcastJobResponse>` (was Optional); guards `isAvailable` at top; returns all concurrent broadcasts for multi-SOS
- ✅ `JobController` — abandon returns 200 with `AbandonResponse`; new POST `/{id}/mechanic-take-back`; new POST `/{id}/mechanic-move-on`; broadcast always 200
- ✅ `JobBroadcastRepository` — `countByJobIdAndMechanicProfileIdAndStatus`; `declineAllForMechanicAndJob` (@Modifying JPQL)
- ✅ `JobService` — calls `notifyNewlyOnlineMechanic` after mechanic marks COMPLETED (treats completion as newly-online)
- ✅ `BroadcastScheduler.liftExpiredSuspensions()` — `@Scheduled(cron = "0 1 0 * * *")`, resets SUSPENDED → VERIFIED after midnight
- ✅ `MechanicProfileRepository` — `findByVerificationStatusAndSuspensionEndsAtBefore`

### Global Broadcast Overlay (Frontend) ✅
- ✅ `BroadcastContext.jsx` (NEW) — single global provider; polls every 5s; per-broadcast `receivedAtsRef` map (anchored to server `sentAt`); cancel detection; exposes `handleAccept/Decline/Abandon/TakeBack/MoveOn/clearBroadcastTracking`
- ✅ `BroadcastOverlay.jsx` (NEW) — self-contained overlay used on all mechanic pages; MinimizedStrip (fixed above BottomNav); ExpandedList (scrollable multi-SOS cards); AbandonOfferCard ("Take it back" / "Move on"); BroadcastCancelledCard; auto-expands on new broadcast, skips expand on navigation via `mountedRef`
- ✅ `App.jsx` — single `BroadcastProvider` wrapping all `<Routes>` (state persists across navigation)
- ✅ `MechanicDashboardPage` — removed all local broadcast state/poll/components; uses `useBroadcast()`; "Abandon job" button removed from active job sheet (Log out path still calls abandon internally); `clearBroadcastTracking()` called on going offline
- ✅ `MechanicHistoryPage` — `<BroadcastOverlay>` mounted; SOS strip visible from History page
- ✅ `ProfilePage` — `<BroadcastOverlay>` mounted for mechanics; SOS strip visible from Profile page

### Bug Fixes (Post-testing) ✅
- ✅ Strip auto-expanding on navigation: `mountedRef` guard in BroadcastOverlay skips auto-expand on initial mount
- ✅ False "User Cancelled" card on offline toggle: `clearBroadcastTracking()` clears refs before going offline so next empty poll doesn't trigger cancel detection
- ✅ Timer reset on spam online/offline: timer anchored to `b.sentAt` (server time) instead of `Date.now()`
- ✅ `setPendingBroadcast(null)` leftover in dashboard offline toggle — was a silent ReferenceError caught by try/catch, causing "Something went wrong" every time mechanic went offline; replaced with `clearBroadcastTracking()`
- ✅ Admin panel unsuspend/suspend/delete silently failing: `AdminMechanicResponse` has `mechanicProfileId` not `id`; all `m.id` calls in Mechanics tab replaced with `m.mechanicProfileId`

---

## Step 17 — WebSocket Integration (Real-Time Push) ✅

### Backend ✅
- ✅ `WebSocketConfig.java` (NEW) — STOMP over native WebSocket (`/ws` endpoint, no SockJS); `/topic` broker, `/app` prefix
- ✅ `WebSocketEventPublisher.java` (NEW) — thin wrapper around `SimpMessagingTemplate`; `publishJobUpdate(userAccId, mechanicAccId, payload)` + `publishBroadcast(mechanicAccId, payload)`; `afterCommitOrNow()` helper defers WS publish until after DB transaction commits — prevents race where WS fires before the DB write is visible to polling readers
- ✅ `SecurityConfig` — `/ws/**` added to `permitAll()` for WebSocket handshake; `OPTIONS` added to CORS allowed methods
- ✅ `JobService` — `WebSocketEventPublisher` injected; WS publish added after every state transition: `assignMechanic` (ACCEPTED), `cancelJob` (CANCELLED — pings assigned mechanic OR all SENT broadcast mechanics for PENDING jobs), `updateStatus` (ARRIVAL_REQUESTED / COMPLETION_REQUESTED), `confirmArrival` (IN_PROGRESS), `rejectArrival` (ACCEPTED), `confirmComplete` (COMPLETED), `rejectComplete` (IN_PROGRESS)
- ✅ `JobService.cancelJobOnLogout()` — now `@Transactional`, fires WS events for both PENDING (broadcast ping) and ACCEPTED (job-update ping) cases; previously cancelled silently with no real-time notification
- ✅ `JobController` — `POST /api/jobs/logout` endpoint added; calls `cancelJobOnLogout()` while JWT is still valid
- ✅ `BroadcastService` — `WebSocketEventPublisher` injected; `broadcastToRing()` pings each mechanic after saving broadcast; `handleAccept()` publishes job-update to both user + mechanic; `mechanicAbandon()` publishes job back to PENDING to user; `mechanicTakeBack()` publishes ACCEPTED to both sides; `advanceOrTimeout()` publishes CANCELLED to user when ring exhausted; `notifyNewlyOnlineMechanic()` pings mechanic on new broadcast

### Frontend ✅
- ✅ `@stomp/stompjs` installed (native WebSocket, no SockJS — SockJS is CommonJS and breaks Vite)
- ✅ `WebSocketContext.jsx` (NEW) — single STOMP client per session; `registeredRef` tracks all desired subscriptions permanently (survives reconnects); `onConnect` re-applies entire `registeredRef` on every connect/reconnect; `reconnectDelay: 2000ms`; disconnects on logout
- ✅ `ActiveJobContext.jsx` — WS subscribe to `/topic/account/{user.id}/job-update`; triggers `fetchActiveJob()` on event; 5s poll → 30s fallback
- ✅ `BroadcastContext.jsx` — WS subscribe to `/topic/account/{user.id}/broadcast`; triggers `poll()` on event; 5s poll → 30s fallback; `broadcastCancelledByUser` state replaced with `showSnackbar()` (auto-dismiss, no blocking modal)
- ✅ `App.jsx` — `<WebSocketProvider>` wraps `<BrowserRouter>` children, above `BroadcastProvider` and `ActiveJobProvider`
- ✅ `AuthContext.jsx` — `logout()` made async; calls `POST /api/jobs/logout` before clearing localStorage so JWT is still valid when backend fires WS events

### Bug Fixes ✅
- ✅ Blank white page on load: `sockjs-client` is CommonJS — Vite fails at runtime. Fixed by removing SockJS entirely, using `brokerURL` (native WebSocket) on both client and server
- ✅ WS publish before DB commit: `afterCommitOrNow()` registers `TransactionSynchronization.afterCommit()` when inside a transaction; WS fires only after DB is committed and visible to pollers
- ✅ Missing WS publish in `handleAccept()`: mechanic accepted but user waited 30s for ACCEPTED state — fixed by adding `publishJobUpdate` in BroadcastService.handleAccept()
- ✅ PENDING cancellation not reaching mechanics: `cancelJob()` collected SENT broadcast mechanic IDs BEFORE expiring broadcasts; after cancel, pinged each via `publishBroadcast(BROADCAST_CANCELLED)` so their overlay cleared instantly
- ✅ Logout not reflected on mechanic side: `cancelJobOnLogout()` had no WS events; fixed by adding full WS notification logic + a `/jobs/logout` endpoint called by frontend before clearing token
- ✅ WS subscriptions lost after reconnect: old code used `pendingRef` (drained after first connect, empty on reconnect) → subscriptions lost silently after any drop. Fixed with `registeredRef` (permanent source of truth); `onConnect` always re-applies all entries

### UX Fix ✅
- ✅ `BroadcastCancelledCard` (full-screen blocking modal requiring "Got it" click) — removed; replaced with `BroadcastToast` auto-dismissing snackbar (3s, `pointerEvents: none`, appears on every return path of BroadcastOverlay)

---

## Step 16 — Rating/Review Flow + Mechanic Trust Card + Photo Lightbox ✅

### Rating / Review Flow ✅
- ✅ `account/Review.java` — existing entity extended with `jobId` (Long, nullable) + `tags` (String, nullable, comma-separated)
- ✅ `review/ReviewRepository.java` — imports `account.Review`; `existsByJobIdAndReviewerId` duplicate guard
- ✅ `review/dto/ReviewRequestDto.java` — record: `rating` (1–5, @NotNull @Min @Max), `comment`, `List<String> tags`
- ✅ `review/ReviewService.java` — `submitReview`: ownership + COMPLETED + no-duplicate checks; rolling average update on MechanicProfile
- ✅ `JobController` — `POST /api/jobs/{id}/review` (USER only)
- ✅ `SecurityConfig` — USER rule for `/api/jobs/*/review`
- ✅ `MechanicProfile` — `averageRating` (Double, nullable=true) + `reviewCount` (Integer, nullable=true, default 0)
- ✅ `AccountMeResponse` + `AccountService.getMe()` — exposes `averageRating`, `reviewCount`, `totalJobsCompleted` for MECHANIC (null for USER)
- ✅ `ActiveJobContext` — `justCompletedJobId` state; set before clearing `activeJob` in `handleConfirmComplete`
- ✅ `components/RatingPrompt.jsx` (NEW) — full-screen overlay; 5 interactive stars; 8 quick-tag chips; optional comment textarea; Submit + Skip; self-guards on role + justCompletedJobId
- ✅ `App.jsx` — `<RatingPrompt />` mounted globally alongside `<ActiveJobFloat />`
- ✅ `ProfilePage` — mechanic stats updated to 4 tiles: Rating (⭐ avg or "New") / Jobs Done / Status / Now

### Mechanic Trust Card + User Info Card ✅
- ✅ `JobResponseDto` — 5 new fields: `mechanicName`, `mechanicPhone`, `mechanicRating`, `mechanicReviewCount`, `userName`
- ✅ `JobService.toDto()` — looks up MechanicProfile (when assigned) for mechanic identity fields; looks up Account for `userName`
- ✅ `ActiveJobFloat` — user's expanded panel: gold mechanic trust card (avatar + name + star rating or "New mechanic")
- ✅ `ActiveJobFloat` — mechanic's expanded panel: red user info card (avatar + name + address/area)
- ✅ `ActiveJobFloat` — "Call mechanic" action button uses `tel:${activeJob.mechanicPhone}` (real number, not placeholder)

### SOS Photo in Active Job Card + Lightbox ✅
- ✅ `ActiveJobFloat` — "View photo" pill (📷 icon + label + chevron) shown when `activeJob.photoUrl` is set; visible to both user and mechanic
- ✅ `ActiveJobFloat` — tapping pill opens full-screen lightbox: dark blurred backdrop, `objectFit: contain`, × close button, tap-anywhere-to-close

---

## Step 15.5 — Mutual Confirmation + Proximity Gate ✅

### Backend ✅
- ✅ `JobStatus` enum — 2 new values: `ARRIVAL_REQUESTED`, `COMPLETION_REQUESTED`; PostgreSQL CHECK constraint migrated to include them
- ✅ `JobService.updateStatus` — mechanic now transitions ACCEPTED→ARRIVAL_REQUESTED and IN_PROGRESS→COMPLETION_REQUESTED (no longer jumps directly to IN_PROGRESS or COMPLETED)
- ✅ `JobService` — 4 new USER-only methods: `confirmArrival` (→IN_PROGRESS), `rejectArrival` (→ACCEPTED), `confirmComplete` (→COMPLETED + mechanic auto-online + notifyNewlyOnlineMechanic), `rejectComplete` (→IN_PROGRESS)
- ✅ `JobService.cancelJob` — allows cancel from ARRIVAL_REQUESTED, blocks from COMPLETION_REQUESTED (work done)
- ✅ `JobService.cancelJobOnLogout` + `getActiveJobs` + `getMechanicActiveJob` — all include the 2 new statuses
- ✅ `BroadcastService.mechanicAbandon` — guard updated to allow abandon from ARRIVAL_REQUESTED + COMPLETION_REQUESTED
- ✅ `JobController` — 4 new USER endpoints: `POST /{id}/confirm-arrival`, `reject-arrival`, `confirm-complete`, `reject-complete`
- ✅ `SecurityConfig` — 4 new USER-only rules for the above endpoints

### Frontend ✅
- ✅ `ActiveJobContext` — ACTIVE_STATUSES updated; `handleJobStatus` query-param fix (`?status=X`); `jobCompletedSuccessfully` + `justCompletedJobId` states; 4 new handlers (confirmArrival/rejectArrival/confirmComplete/rejectComplete); false-cancel detection fixed (status check + fallback `GET /jobs/{id}` lookup)
- ✅ `ActiveJobFloat` — `haversineKm` pure-math helper; 15s proximity poll in ACCEPTED state; "Mark Arrived" gated at 500 m with distance label; ARRIVAL_REQUESTED / COMPLETION_REQUESTED mechanic waiting pills + contextual hints; user confirmation cards for both states (Confirm / Not yet); job completion overlay for mechanic (green checkmark, 3s countdown, auto-redirect to `/mechanic/dashboard`)

---

## Step 12 — Navigation Map + Mechanic Abandon + Bug Fixes ✅

### Navigation Map (Leaflet) ✅
- ✅ NavigationMap.jsx (new component) — real Leaflet map, lazy-loaded (React.lazy + Suspense)
- ✅ CartoDB Dark Matter tiles — free, no API key, matches Iron Man theme
- ✅ Green mechanic dot + red user dot + dashed red polyline connecting them
- ✅ FitBounds inner component (useMap + useMemo) — auto-fits both markers with padding
- ✅ MechanicDashboardPage — NavigationMap swaps in when job is active + mechCoords known
- ✅ mechCoords recovery useEffect — re-captures GPS on page refresh during active job
- ✅ "Open in Google Maps" button — z-index 25, `dir_action=navigate&travelmode=driving` for direct navigation mode

### Mechanic Abandon Flow ✅
- ✅ BroadcastService.mechanicAbandon() — validates ownership, resets job to PENDING Ring 1, rebroadcasts
- ✅ JobController — POST /{id}/mechanic-abandon endpoint
- ✅ SecurityConfig — MECHANIC route for /api/jobs/*/mechanic-abandon
- ✅ MechanicDashboardPage — "Log out anyway" calls abandon API (try-finally) before logout
- ✅ DashboardPage — rebroadcastBanner state, ⚠️ banner shown on ACCEPTED/IN_PROGRESS → PENDING transition
- ✅ DashboardPage — poll expanded to all ACTIVE_STATUSES (not just PENDING)

### Broadcast Bug Fixes ✅
- ✅ BroadcastScheduler — ring stuck at 1 after abandon: fixed by using lifecycle-aware count (sentAt >= broadcastStartedAt)
- ✅ JobBroadcastRepository — countByJobIdAndRingAndSentAtGreaterThanEqual (new derived method)
- ✅ JobService.getPendingJobs — filtered out jobs mechanic already has any broadcast for (existsByJobIdAndMechanicProfileId)
- ✅ JobBroadcastRepository injected into JobService

### UI + Polish Fixes ✅
- ✅ ProfilePage — shows "On Job" (not "Offline") when mechanic has active job: fetches /jobs/mechanic/active
- ✅ MechanicDashboardPage — "On Job" pill (gold) when hasActiveJob; toggle hidden; map shows route
- ✅ MechanicDashboardPage — user-cancel detection: prevActiveJobRef + expectingJobEndRef guard, snackbar "User cancelled the request"
- ✅ DashboardPage — mechanic-assigned info row moved into sheet (removed floating mid-map status tile)
- ✅ DashboardPage — ActiveMap simplified (no floating status card)

---

## Batch F — P0 + F3 + F4 Complete ✅ (2026-05-14, session 2)

### P0 — SOS Cancel Penalty Redesign ✅
- ✅ `JobService.cancelJob()` — removed pre-acceptance `wasPending` penalty block entirely
- ✅ Added `wasAccepted` block: only ACCEPTED or ARRIVAL_REQUESTED cancels increment `sosCancelCount`; 3rd in 30 days → 30-min cooldown; 4th+ → 1hr flat

### SOS Send Bug Fix ✅
- ✅ `SOSWizardPage` — `canSend` now uses `(gpsReady || gpsError)` so button enables when GPS fails (graceful fallback lat:0/lng:0)
- ✅ `JobService.createSosRequest()` — active job check expanded to all 5 active statuses (was missing ARRIVAL_REQUESTED and COMPLETION_REQUESTED)

### F3 — Appeal Submission ✅
- ✅ `AppealRequest.java` — new DTO record (reason)
- ✅ `AccountMeResponse.java` — 13th field `appealStatus` (null for USER, enum name for MECHANIC)
- ✅ `AdminMechanicResponse.java` — `appealReason` field added
- ✅ `MechanicProfileRepository` — `findByAppealStatus(AppealStatus)` derived query
- ✅ `AccountService` — `getMe()` exposes appealStatus; 4 new methods: `submitAppeal`, `getPendingAppeals`, `adminApproveAppeal`, `adminRejectAppeal`
- ✅ `AccountController` — 4 new endpoints: POST /api/accounts/appeal, GET+POST /api/admin/appeals/**
- ✅ `SecurityConfig` — MECHANIC rule for POST /api/accounts/appeal
- ✅ `MechanicDashboardPage` — `SuspendedWall` rebuilt: shows suspension reason card, textarea + submit when NONE/REJECTED, gold "Appeal pending" pill when PENDING, calls fetchMe on success
- ✅ `AdminDashboardPage` — Appeals tab with badge count, approve/reject cards

### F4 — Report Submission ✅
- ✅ `ReportRepository.java` — NEW: existsByReporterIdAndJobId, countByMechanicIdAndStatus, findByStatus
- ✅ `ReportRequestDto.java` — NEW: record (reason, description)
- ✅ `AdminReportResponse.java` — NEW: id, jobId, reporterName, mechanicName, reason, description, status, createdAt
- ✅ `ReportService.java` — NEW: submitReport (4 guards + auto-suspend at 3+ pending reports), getAdminReports, resolveReport
- ✅ `JobController` — 3 new endpoints: POST /{id}/report (USER), GET+POST /admin/reports/**
- ✅ `SecurityConfig` — USER rule for POST /api/jobs/*/report
- ✅ `ActiveJobFloat.jsx` — Report button (user+IN_PROGRESS), bottom sheet with 5 reason pills + optional description + inline error, "✓ Reported" state
- ✅ `AdminDashboardPage.jsx` — Reports tab with badge (wires existing pendingReports OverviewTab tile), ReportsTab component with resolve action

---

## Batch F — F1 + F2 Complete ✅ (2026-05-14)

### F1 — Mechanic Profile Photo Upload ✅
- ✅ `Account.java` — `profilePhotoUrl` (String, nullable) field added
- ✅ `CloudinaryService.java` — folder-parameterized overload: `upload(file, folder)` with `upload(file)` delegating to `pitstop/jobs`; JPEG/PNG/WebP + 5MB guard applied in both
- ✅ `AccountMeResponse.java` — `profilePhotoUrl` added as 12th constructor param + getter
- ✅ `AccountService.java` — `uploadProfilePhoto(accountId, file)`: uploads to `pitstop/profiles`, saves URL to Account, returns URL
- ✅ `AccountController.java` — `POST /api/accounts/profile-photo` (MECHANIC only, multipart)
- ✅ `SecurityConfig.java` — MECHANIC-only rule for `POST /api/accounts/profile-photo`
- ✅ `JobResponseDto.java` — `mechanicPhotoUrl` field added (populated from `Account.profilePhotoUrl` of assigned mechanic)
- ✅ `JobService.toDto()` — extracts `mechanicPhotoUrl` from `mp.getAccount().getProfilePhotoUrl()`
- ✅ `Avatar.jsx` — `src` prop added; renders `<img>` with `objectFit: cover` when src is present, falls back to initials
- ✅ `ProfilePage.jsx` — hidden `<input type="file">`, camera icon overlay on avatar (MECHANIC only), `handlePhotoChange()` uploads + calls `updateUser({ profilePhotoUrl })` to sync AuthContext
- ✅ `ActiveJobFloat.jsx` — mechanic trust card shows photo (`<img>`) when `activeJob.mechanicPhotoUrl` is present, falls back to initial letter

### F2 — Heartbeat System ✅
- ✅ `JobRepository.java` — `findByStatusIn(List<JobStatus>)` derived query added
- ✅ `AccountService.java` — `updateHeartbeat(accountId)`: finds MechanicProfile by accountId, sets `lastHeartbeatAt = now`, saves
- ✅ `AccountController.java` — `POST /api/mechanic/heartbeat` (MECHANIC only)
- ✅ `SecurityConfig.java` — MECHANIC-only rule for `POST /api/mechanic/heartbeat`
- ✅ `BroadcastScheduler.java` — `checkStaleHeartbeats()` `@Scheduled(fixedDelay=60_000)`: queries ACCEPTED/ARRIVAL_REQUESTED/IN_PROGRESS/COMPLETION_REQUESTED jobs; skips null `lastHeartbeatAt` (pre-feature or just-accepted grace); calls `mechanicAbandon()` when stale > 5 min
- ✅ `ActiveJobFloat.jsx` — heartbeat `useEffect` (mechanic side only): pings immediately on mount, then every 30s; clears interval when job ends or component unmounts

### Bug Fix — Broadcast Decline Snackbar ✅
- ✅ `BroadcastContext.jsx` — `handleDecline` rewritten: always removes card silently regardless of API result; no snackbar on any error path (decline is best-effort)

---

## Full App Audit — Security Hardening + Rate Limiting + UX Polish ✅ (2026-05-13)

### Batch A — Broken Running Features ✅
- ✅ A1 — Race condition: `@Version` on `Job.java`; `ObjectOptimisticLockingFailureException` caught in `BroadcastService.handleAccept()` → 409 CONFLICT
- ✅ A2 — Ban check: `login()` reads `isBanned` first; banned accounts get 403 before password is checked
- ✅ A3 — SOS timeout enforced: `createSosRequest()` checks `sosTimeoutUntil` before allowing new SOS
- ✅ A4 — `totalJobsCompleted` incremented in `confirmComplete()` after each successful job
- ✅ A5 — Legacy `/assign` endpoint deleted from `JobController`, `JobService`, `SecurityConfig` — was bypassing broadcast queue entirely

### Batch B — Security Hardening ✅
- ✅ B1 — JWT secret moved from hardcoded constant to `@Value("${jwt.secret}")` in `JwtUtil`; `application.properties` reads from `JWT_SECRET` env var (matches existing DB_PASSWORD pattern)
- ✅ B2 — IDOR closed: `GET /api/jobs/*` and `GET /api/jobs/mechanic/*` now require ADMIN role; frontend already uses role-specific endpoints (`/my/active`, `/mechanic/history` etc.) — not affected
- ✅ B2 — `ActiveJobContext.jsx` fallback `api.get('/jobs/{id}')` removed (would have returned 403); replaced with status-based heuristic for job-ended detection

### Batch C — Rate Limiting ✅
- ✅ C1 — `RateLimiterService.java` (new): ConcurrentHashMap-based sliding-window rate limiter; `checkAndRecord(key, maxCalls, windowMinutes)` throws 429 on breach
- ✅ C1 — Register: 3 per hour per IP. Login failures: 5 per 15 minutes per IP
- ✅ C1 — Forgot-password: 60s cooldown per email via `lastPasswordResetRequestAt` on `Account`
- ✅ C1 — `AccountController.getClientIp()` reads `X-Forwarded-For` for real IP behind proxy
- ✅ C2 — Availability toggle: 10s cooldown via `lastAvailabilityToggleAt` on `MechanicProfile`
- ✅ C2 — Ring fix: `findEligiblePendingJobsForMechanic` now applies `LEAST(:maxKm, ring_band_max)` — mechanic coming online mid-broadcast can only receive jobs within the job's current ring band
- ✅ C3 — Pre-acceptance cancel tracking: `sosCancelCount` incremented on PENDING cancels; 1-hour `sosTimeoutUntil` applied on 3rd+ cancel

### Batch D — Resource Guards ✅
- ✅ D1 — Email verification enforced in `login()`: unverified accounts get 403 with "Please verify your email" message
- ✅ D2 — Cloudinary guard: JPEG/PNG/WebP only, max 5MB; rejects before hitting Cloudinary API

### Batch E — UX Loading States ✅
- ✅ E1 — `BroadcastOverlay.jsx`: `JobRequestCard` has local `accepting` state; Accept button shows "Accepting…" and both buttons disabled until API resolves; error resets state
- ✅ E1 — `ActiveJobFloat.jsx`: confirmation buttons show dynamic text when `activeJobLoading` is true — "Confirming…", "Marking…" instead of static labels

---

## Step 11 — Broadcast Resilience + Profile + Mechanic History ✅

### Broadcast Resilience ✅
- ✅ CancellationReason enum — NO_MECHANICS_AVAILABLE / BROADCAST_EXHAUSTED / USER_CANCELLED
- ✅ Job.cancellationReason field — @Enumerated(STRING), nullable, set by advanceOrTimeout + cancelJob
- ✅ BroadcastService — removed instant cascade on empty ring; scheduler handles 2-min wait
- ✅ BroadcastScheduler — fixed: advances ring when totalInRing == 0 (was silently skipping empty rings)
- ✅ JobRepository — findEligiblePendingJobsForMechanic (Haversine reverse query)
- ✅ JobBroadcastRepository — countByJobId (for NO_MECHANICS_AVAILABLE detection)
- ✅ AccountService — notifyNewlyOnlineMechanic called on toggle ON (mechanic gets live SOS mid-broadcast)
- ✅ JobResponseDto — cancellationReason field added
- ✅ DashboardPage — WallScreen overlay for NO_MECHANICS_AVAILABLE / BROADCAST_EXHAUSTED; silent clear for USER_CANCELLED

### UI Polish ✅
- ✅ pitstop.css — gunmetal steel background (--bg #0C0E16, --surface #12141F etc.)
- ✅ HeartbeatMap ring animation fixed — opacity:0 start + animation-fill-mode:both (no settle glitch)
- ✅ Dashboard 720p blur fixed — removed all backdropFilter from map area elements
- ✅ BottomSheet — swipe-down-to-dismiss gesture (80px threshold, backdrop fades during drag)
- ✅ History page ordering fixed — newest jobs/months appear first (OrderByCreatedAtDesc)
- ✅ MechanicDashboardPage — PitStopLogo component replaces inline logo; Avatar component replaces inline circle

### Profile Page ✅
- ✅ ProfilePage.jsx (new) — shared page for USER + MECHANIC roles, reads role from AuthContext
- ✅ Name inline edit — pencil → input → PATCH /api/accounts/name → AuthContext.updateUser (no re-login)
- ✅ Stats strip — USER: completed/cancelled counts from history; MECHANIC: status + online/offline
- ✅ Change Password row → /forgot-password; Logout row
- ✅ AuthContext — updateUser() added to patch user state + localStorage without full re-login
- ✅ AccountController — PATCH /api/accounts/name
- ✅ AccountService — updateName() with blank-name guard
- ✅ App.jsx — /profile (USER) + /mechanic/profile (MECHANIC) routes added

### Bell Icon — Notification Preferences ✅
- ✅ DashboardPage + MechanicDashboardPage — bell onClick opens BottomSheet with preference toggles
- ✅ Preferences stored in localStorage (pitstop_notif_prefs); gold dot appears when any pref is on
- ✅ User prefs: SOS status updates · Mechanic nearby alerts
- ✅ Mechanic prefs: New job requests · Account & approval updates

### Mechanic History Page ✅
- ✅ MechanicHistoryPage.jsx (new) — Iron Man theme, grouped by month, summary strip, month total card
- ✅ GET /api/jobs/mechanic/history — new endpoint, MECHANIC-only, returns COMPLETED jobs newest-first
- ✅ JobRepository — findByMechanicProfileIdAndStatusInOrderByCreatedAtDesc
- ✅ JobService — getMechanicJobHistory(accountId)
- ✅ SecurityConfig — /api/jobs/mechanic/history restricted to MECHANIC role
- ✅ App.jsx — /mechanic/history route added
- ✅ MechanicDashboardPage BottomNav — History path corrected to /mechanic/history

---

## Session 3 — 2026-05-14 ✅

### F5 — Mechanic Area Reverse Geocoding ✅
- ✅ `GeocodingService.java` (NEW) — calls Nominatim `reverse` API with 500ms connect+read timeout; extracts `suburb → city_district → county`; returns null on any failure; never blocks the caller
- ✅ `AccountService.toggleAvailability()` — geocoding runs via `CompletableFuture.runAsync()` after save; toggle response is instant; area written to DB in background
- ✅ `MechanicProfile.area` column now populated whenever mechanic goes online

### Toggle Spam UX Fix ✅
- ✅ `AccountService` — 429 message includes exact remaining seconds: "Please wait 7 more seconds before toggling again"
- ✅ `MechanicDashboardPage` — `lastToggleRef` tracks last successful toggle time; 429 handler computes remaining seconds client-side and shows specific snackbar instead of generic "Something went wrong"

### G1 — WebSocket Subscription Authentication ✅
- ✅ `WebSocketChannelInterceptor.java` (NEW) — STOMP `ChannelInterceptor`; on `CONNECT` validates JWT from `Authorization` header, stores `accountId` in session attributes; on `SUBSCRIBE` to `/topic/account/{id}/...` verifies `{id}` matches session accountId; any other topic passes through
- ✅ `WebSocketConfig.java` — registers interceptor via `configureClientInboundChannel()`
- ✅ Puppeteer-tested: own topic allowed, other account's topic → ERROR frame, no token → ERROR frame

### H1 — CORS Externalisation ✅
- ✅ `SecurityConfig.java` — `@Value("${cors.allowed.origins}")` replaces hardcoded `http://localhost:5173`; comma-separated multi-origin supported
- ✅ `Stack.md` — "Before Deploy" checklist added covering `cors.allowed.origins`, `DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_SECRET`
- ⚠️ Manual step required: add `cors.allowed.origins=http://localhost:5173` to local `application.properties`

---

## Session 5 — 2026-05-15 ✅

### Live Tracking Bug Fixes ✅
- ✅ `ActiveJobFloat.jsx` — Cancel button condition fixed: now shown for `isPending || isAccepted || isArrivalRequested` (was missing `isArrivalRequested`)
- ✅ `ActiveJobFloat.jsx` — Call button condition fixed: now shown for `isAccepted || isArrivalRequested || isInProgress` (was missing `isArrivalRequested`)

### User Phone Feature — Full Stack ✅
- ✅ `Account.java` — `phone` nullable String field + `getPhone()` / `setPhone()` added
- ✅ `AccountMeResponse.java` — `phone` added as 14th constructor param + getter; returned from `/api/accounts/me`
- ✅ `AccountService.java` — `register()` saves `request.phone()` for USER role; `getMe()` passes `account.getPhone()` to response; new `updatePhone()` method with blank-guard
- ✅ `AccountController.java` — `PATCH /api/accounts/phone` endpoint added
- ✅ `SecurityConfig.java` — USER-only rule for `PATCH /api/accounts/phone`
- ✅ `JobResponseDto.java` — `userPhone` added as 25th field + getter
- ✅ `JobService.toDto()` — fetches user account once; extracts both `userName` and `userPhone`; passes `userPhone` as last arg to `JobResponseDto` constructor
- ✅ `RegisterPage.jsx` — `phone` added to form state; required phone input (type=tel) between email and password; validation + API payload
- ✅ `ProfilePage.jsx` — USER-only phone row with pencil-edit: inline input → `PATCH /api/accounts/phone` → `updateUser({ phone })`; shows "Add phone number" when empty
- ✅ `ActiveJobFloat.jsx` — mechanic call `<button>` replaced with `<a href="tel:${activeJob.userPhone}">Call user</a>`; condition now includes `isArrivalRequested`; label changed to "Call user"

---

## Session 13 — 2026-05-17 (Deployment — Railway + Vercel) 🔄

### Phase 1 — Code Fixes ✅
- ✅ `axios.js` — baseURL reads from `VITE_API_BASE_URL` env var with localhost fallback
- ✅ `WebSocketContext.jsx` — brokerURL derived from same env var; auto-upgrades http→ws, https→wss
- ✅ `application-prod.properties` (NEW) — prod Spring Boot profile; all secrets via `${ENV_VAR}` refs; committed to repo
- ✅ `.env.local` (NEW, gitignored) — local dev env var file; `VITE_API_BASE_URL=http://localhost:8080/api`
- ✅ Security sweep — found `firebase-service-account.json` with live key in untracked files; deleted from disk; added to both gitignore files; user deleted Firebase project making key permanently dead
- ✅ `.npmrc` — `legacy-peer-deps=true` to resolve react-leaflet vs React 19 conflict on Vercel
- ✅ `vercel.json` — SPA rewrites: all paths → `/index.html` for React Router
- ✅ `package.json` — Vite pinned to `^5.4.19`, plugin-react to `^4.3.4` (Vite 8 rolldown has import resolution bugs)

### Phase 2 — Railway Backend ✅
- ✅ Spring Boot service deployed from `pitstop-backend` root directory
- ✅ PostgreSQL service provisioned; connected via reference variables (`${{Postgres.PGHOST}}` etc.)
- ✅ Env vars set: `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `MAIL_PASSWORD`
- ✅ Backend LIVE at `pitstop-production-a67e.up.railway.app` — HikariPool connected, WebSocket broker running

### Phase 3 — Vercel Frontend 🔄
- ✅ Project created, linked to repo, `VITE_API_BASE_URL` env var set
- ✅ `CORS_ALLOWED_ORIGINS` updated in Railway to `https://pitstop-silk.vercel.app`
- 🔄 Final Vite v5 deploy triggered via deploy hook at session end — pending verification

### Blockers Hit & Resolved
- Railway PostgreSQL vars not auto-shared → fixed with `${{Postgres.PGVAR}}` reference syntax
- react-leaflet peer dep conflict → fixed with `.npmrc legacy-peer-deps=true`
- React Router 404 on reload → fixed with `vercel.json` rewrites
- Vite 8 rolldown UNRESOLVED_IMPORT bug → fixed by pinning to Vite 5
- Registration 500 → SMTP failure from wrong MAIL_PASSWORD (login password vs App Password)

---

## Session 11 — 2026-05-16 (Full Implementation + End-to-End Testing) ✅

### Phase 1 — Registration Redesign ✅
- ✅ `RegisterPage.jsx` — 2-step flow (step 1: name/email/password/confirm, step 2: phone + info card); email verification enforced — on success renders "Check your inbox" screen, no JWT issued
- ✅ `MechanicRegisterPage.jsx` — same 2-step flow; service radius field removed entirely; step 2 adds red warning card about fake phone consequences
- ✅ `AccountService.register()` — changed from `LoginResponse` return to `void`; service radius defaulted to `10.0` (no longer required from form); phone saved for all roles
- ✅ `AccountController.register()` — returns `Map<String, String>` with verification message instead of JWT
- ✅ `VerifyEmailPage.jsx` — token sent via query param (not body); auto-navigates by role (USER → /dashboard, MECHANIC → /onboarding) after 2s; no manual button needed

### Phase 2 — Phone Infrastructure ✅
- ✅ `SecurityConfig.java` — PATCH /api/accounts/phone now allows both USER and MECHANIC
- ✅ `AppealRequest.java` — extended with `updatedPhone` field
- ✅ `AccountService.submitAppeal()` — saves `updatedPhone` to account if provided
- ✅ `MechanicDashboardPage.jsx` SuspendedWall — appeal textarea + phone update input wired up
- ✅ `ActiveJobFloat.jsx` — report reasons extended: "Wrong/non-working phone number", "Mechanic unreachable (phone + chat)"
- ✅ `ReportService.java` — maturity guard for phone-related report reasons (2+ completed jobs or 30+ days old account)

### Phase 3 — In-Job Chat ✅
- ✅ `ChatMessage.java` — entity with jobId, senderId, senderRole, body, sentAt, isRead
- ✅ `ChatMessageRepository.java` — history query, existsBySenderIdAndJobIdAndSentAtAfter
- ✅ `ChatService.java` — sendMessage (participant check, WS publish), getHistory, markRead
- ✅ `ChatController.java` — WebSocket @MessageMapping + REST history + REST markRead
- ✅ `WebSocketChannelInterceptor.java` — extended to validate /topic/job/{id}/chat subscriptions; participant check (user or assigned mechanic only)
- ✅ `useChatMessages.js` (NEW) — subscribes to chat topic, loads REST history, send() + markRead()
- ✅ `ChatOverlay.jsx` (NEW) — full-screen chat UI, fixed bottom: 56 to clear BottomNav, role-aware bubble alignment
- ✅ `ActiveJobFloat.jsx` — Chat button wired in all active states for both user and mechanic; ChatOverlay mounted on demand
- ✅ `BroadcastOverlay.jsx` — subscribes to active job chat topic; shows tappable toast on new user message

### Phase 4 — Reach-Alert + Escape Hatch ✅
- ✅ `Job.java` — `reachAlertSentAt` field
- ✅ `JobService.sendReachAlert()` — POST /api/jobs/{id}/reach-alert; one-shot, WS push to mechanic
- ✅ `JobService.triggerMechanicUnreachable()` — POST /api/jobs/{id}/mechanic-unreachable; no user cancel penalty; restores mechanic online; calls declineAllForMechanicAndJob to block re-broadcast; auto-files report; WS ping with UNREACHABLE_ESCAPE reason
- ✅ `ActiveJobFloat.jsx` — Stage 0 advisory card (mechanic, dismissable, localStorage-backed with React state); Stage 1 undismissable alert card (mechanic); user "Can't reach?" link → confirm → alert sent; countdown timer (5 min); escape hatch button with confirm sheet

### Phase 5 — Post-Appeal Zero Tolerance ✅
- ✅ `MechanicProfile.java` — `wrongNumberReportCountPostAppeal` field
- ✅ `ReportService.java` — post-appeal increment + permanent ban on 2nd post-appeal offense
- ✅ `MechanicDashboardPage.jsx` SuspendedWall — red warning note about permanent ban after re-offense

### Bug Fixes (discovered during testing) ✅
- ✅ `ChatService.java` — primitive `long` comparison fixed (used `Long.equals()` pattern)
- ✅ `WebSocketChannelInterceptor.java` — same primitive comparison fixed
- ✅ `useChatMessages.js` — removed double `/api` prefix on all REST calls
- ✅ `ChatOverlay.jsx` — bottom: 56 so overlay doesn't cover BottomNav
- ✅ `ActiveJobFloat.jsx` — advisory dismiss now updates React state alongside localStorage (was not re-rendering)
- ✅ `ActiveJobFloat.jsx` — early return guard now renders snackbar even when activeJob is null (snackbar was silently killed when card unmounted on job disappear)
- ✅ `JobService.triggerMechanicUnreachable()` — mechanic restored online after escape hatch (was staying offline); declineAllForMechanicAndJob called to block escaped mechanic from re-broadcast
- ✅ `BroadcastService.handleAccept()` — collects competing mechanics before expiring; pings them with BROADCAST_TAKEN after accept
- ✅ `BroadcastContext.jsx` — BROADCAST_TAKEN WS type shows fun "Too slow!" message; suppressCancelSnackRef prevents double-toast from poll

### DB Cleanup ✅
- ✅ `DROP TABLE IF EXISTS appeals, mechanic_tags, notifications` — confirmed clean (tables never existed in this DB)

---

## Session 10 — 2026-05-15 (Architecture Design — Phone Auth + Chat + Reach-Alert System) ✅

### What was done
- ✅ Full design session — no code written, full architecture planned for next session
- ✅ Decided on 2-page registration flow for both user and mechanic
- ✅ Decided to remove service radius from mechanic registration (confirmed unused in broadcast system)
- ✅ Designed phone authenticity system via crowd-sourced reporting with full gap analysis
- ✅ Designed in-job chat feature — full infrastructure plan leveraging existing WebSocket
- ✅ Designed 2-stage "Can't reach mechanic" escape hatch (reach-alert → escape hatch)
- ✅ Designed Stage 0 advisory card (mechanic on acceptance), Stage 1 alert card (mechanic on user report), Stage 2 escape (after mechanic ignores alert)
- ✅ All gaps identified and fixed: WS chat auth, report abuse, multi-account attacks, mechanic WS disconnected mid-drive, race condition on chat response, post-appeal zero tolerance
- ✅ Full 5-phase build order documented in Today.md

---

## Session 9 — 2026-05-15 (Firebase OTP Explored + Removed → Social Contract Phone Cards) ✅

### What was built
- ✅ Explored Firebase Phone Authentication as a registration verification mechanism
- ✅ Full implementation built: `FirebaseConfig.java`, `FirebaseService.java`, `PhoneOtpStep.jsx`, `firebase.js`, `.env.local`, `Account.phoneVerified`, `AccountMeResponse.phoneVerified`, `RegisterRequest.firebaseIdToken`, phone verification logic in `AccountService.register()`
- ✅ Hit Firebase Blaze billing wall — real SMS requires Blaze plan with ₹1000 prepayment; could not activate
- ✅ Decision: remove all Firebase code entirely

### Firebase Cleanup ✅
- ✅ Deleted: `FirebaseConfig.java`, `FirebaseService.java` (backend), `firebase.js`, `PhoneOtpStep.jsx`, `.env.local` (frontend)
- ✅ Removed firebase-admin dependency from `pom.xml`
- ✅ Reverted `RegisterRequest.java` — `firebaseIdToken` field removed
- ✅ Reverted `Account.java` — `phoneVerified` field + getter/setter removed
- ✅ Reverted `AccountMeResponse.java` — `phoneVerified` field, constructor param, getter removed
- ✅ Reverted `AccountService.java` — FirebaseService removed from constructor + field + import; phone verification block in `register()` removed; both `getMe()` call sites fixed
- ✅ `.gitignore` — firebase-service-account entry removed

### Social Contract Phone Cards ✅
- ✅ `RegisterPage.jsx` — gold-bordered info card above phone field: "Your mechanic will call this number when they're on the way. Use your real number." Form submits directly to API (no OTP step). Phone validation simplified (required, no country code enforcement).
- ✅ `MechanicRegisterPage.jsx` — same pattern, card says: "Users contact you through this number during active jobs. Use your real number."
- ✅ Puppeteer E2E tested: user registration → dashboard ✓, mechanic registration → onboarding Step 2 ✓

---

## Session 8 — 2026-05-15 (Cancel Penalty Softened + Nearby Count) ✅

### Cancel Penalty UX Update ✅
- ✅ `JobService.cancelJob()` — penalty softened: 3rd post-acceptance cancel in 30 days → 30-min cooldown (was 24hr); 4th+ → 1hr flat (was doubling to 48hr/96hr/...)
- ✅ `ActiveJobContext.jsx` — `handleCancel`: ACCEPTED confirmation message rewritten to be warm and informative; ARRIVAL_REQUESTED now also gets a confirmation dialog (previously had none)
- ✅ Spec.md + Done.md updated to match

### Nearby Mechanics Counter — Full Stack ✅
- ✅ `MechanicProfileRepository.java` — `countNearbyAvailable(lat, lng, radiusKm)` native SQL Haversine query: counts online + VERIFIED mechanics within given radius
- ✅ `AccountController.java` — `GET /api/accounts/nearby-mechanics-count?lat=X&lng=Y` endpoint (USER only); fixed 20km radius; `MechanicProfileRepository` added to constructor injection
- ✅ `SecurityConfig.java` — USER-only rule for `GET /api/accounts/nearby-mechanics-count`
- ✅ `DashboardPage.jsx` — `fetchNearbyCount` callback: silent GPS capture → API call → `setNearbyCount`; fires on mount, every 60s via `setInterval`, and on tab focus via `visibilitychange`; interval + listener cleaned up on unmount; `HeartbeatMap` receives `nearbyCount` prop; hardcoded `6` replaced with `nearbyCount ?? "–"`

---

## Session 7 — 2026-05-15 (Audit Fixes) ✅

### All 9 Audit Items Fixed ✅

#### HIGH — Security (A1–A3)
- ✅ A1 — `WebSocketConfig.java` — `setAllowedOriginPatterns("*")` replaced with `@Value("${cors.allowed.origins}")` split by comma — WS now restricted to the same allowed origins as HTTP
- ✅ A2 — `BroadcastService.handleAccept()` — VERIFIED check added at top; suspended/unverified mechanic now gets 403 immediately
- ✅ A3 — `JobController.createSos()` — `RateLimiterService` injected; 5 SOS per 60 minutes per IP enforced; `getClientIp()` helper added; `HttpServletRequest` param added

#### MEDIUM — Logic Bugs (B1–B4)
- ✅ B1 — `Account.java` + `JobService.cancelJob()` — `sosCancelCountResetAt` field added; 30-day window enforced; threshold raised to 3; 3rd offense = 30-min cooldown; 4th+ = 1hr flat (softened from 24hr doubling in a later session)
- ✅ B2 — `BroadcastService.mechanicAbandon()` — `midJobCancels++` moved outside the `acceptedCount >= 2` branch; all abandons now count on trust profile
- ✅ B3 — Fixed automatically by B2; scheduler calls `mechanicAbandon()` which now always increments `midJobCancels`
- ✅ B4 — `MechanicExpertiseRepository` — `existsByMechanicProfileIdAndWheelerType` added; `JobService.getPendingJobs()` now skips problemType check for DONT_KNOW jobs (vehicleType only)
- ✅ B5/B6 — `Stack.md` Before Deploy checklist updated: `show-sql=false` and `ddl-auto=validate` documented

#### LOW — Dead Code (C1–C2)
- ✅ C1 — `Appeal.java`, `MechanicTag.java`, `Notification.java` deleted (zero usages confirmed by grep); orphaned DB tables remain — run `DROP TABLE IF EXISTS appeals, mechanic_tags, notifications;` manually
- ✅ C2 — `upgradeStatus` field + getter/setter removed from `Account.java`; `UpgradeStatus.java` deleted

---

## Session 6 — 2026-05-15 (Audit) ✅

### Full Codebase Audit ✅
Read every backend (.java) and frontend (.jsx/.css) file. Confirmed 9 real issues:
- 🔴 A1 — `WebSocketConfig.setAllowedOriginPatterns("*")` — any origin can WS connect
- 🔴 A2 — `BroadcastService.handleAccept()` — no VERIFIED check; suspended mechanic can accept
- 🔴 A3 — `JobService.createSosRequest()` — no rate limit on SOS submissions
- 🟡 B1 — Cancel penalty: threshold is 2 (should be 3), duration is 2hr (should be 24hr), no 30-day window
- 🟡 B2 — `midJobCancels` only incremented on second abandon; first abandon goes untracked
- 🟡 B3 — Heartbeat scheduler abandon has no midJobCancels penalty applied
- 🟡 B4 — `getPendingJobs()` filters out DONT_KNOW jobs for mechanics who lack it in expertise
- 🟡 B5 — `spring.jpa.show-sql=true` in application.properties
- 🟡 B6 — `ddl-auto=update` dangerous for production
- 🟢 C1 — Three zombie `@Entity` classes: `Appeal.java`, `MechanicTag.java`, `Notification.java`
- 🟢 C2 — Dead `UpgradeStatus` field + enum on `Account`
All items added to Today.md with exact file locations and fixes.

---

## Session 4 — 2026-05-14 ✅

### H2 — Continuous Mechanic GPS (Replaces Stale Location) ✅
- ✅ `LocationRequest.java` (NEW) — DTO record `(Double latitude, Double longitude)` in `account/dto/`
- ✅ `AccountService.java` — `updateMechanicLocation(accountId, request)`: finds MechanicProfile by accountId, saves lat/lng; **no `isAvailable` guard** (mechanic is offline during job by design; endpoint is MECHANIC-JWT-only)
- ✅ `AccountController.java` — `PATCH /api/mechanic/location` endpoint added (MECHANIC role)
- ✅ `SecurityConfig.java` — `PATCH /api/mechanic/location` rule: `.requestMatchers(HttpMethod.PATCH, "/api/mechanic/location").hasRole("MECHANIC")`
- ✅ `MechanicDashboardPage.jsx` — 60s location interval useEffect: guard `if (!me?.isAvailable && !activeJob) return;`; fires immediately + every 60s; dependency `[me?.isAvailable, !!activeJob]` so it runs while online AND during active job

### Level-2 — Live "~X km away" Distance for User ✅
- ✅ `JobResponseDto.java` — 2 new nullable `Double` fields: `mechanicLat`, `mechanicLng`; added to constructor + getters
- ✅ `JobService.java` — `toDto()`: `mechanicLat = mp.getLatitude(); mechanicLng = mp.getLongitude();` inside existing `if (mp != null)` block; null-safe (null during PENDING)
- ✅ `ActiveJobFloat.jsx` — `mechanicDistKm` computed using existing `haversineKm` helper; guards: not mechanic, `mechanicLat != null`, `mechanicLng != null`
- ✅ `ActiveJobFloat.jsx` — User ACCEPTED/IN_PROGRESS subtitle: "~3.2 km away" when coords available; "Locating mechanic…" when null; "Repair in progress" when IN_PROGRESS
- ✅ Puppeteer-verified: React fiber injection used to simulate mock ACCEPTED job at two coordinates ~5.2 km apart; screenshot confirmed "~5.2 km away" displayed in green mechanic-on-the-way card