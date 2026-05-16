# Today — Current Priorities

> Session 13: Deployment executed. Backend live on Railway. Frontend deploying on Vercel.
> Vite v5 deploy triggered at session end — verify it completes successfully first.

---

## Priority 1 — Verify Vercel Deploy Completed

The Vite v5 + plugin-react v4 fix was deployed via deploy hook at session end.
- Go to Vercel → Deployments → confirm latest build shows "Ready" (not Error)
- Open https://pitstop-silk.vercel.app — login page must load
- Reload on /login URL — must NOT show 404 (vercel.json SPA routing)

---

## Priority 2 — Verify Registration + Email Flow

- Register a brand new account with a real email
- Confirm 200 response (no 500 → SMTP working)
- Check inbox for verification email
- Click link → must redirect to dashboard with correct role

If email still fails → check Railway logs for exact SMTP error. May need to regenerate the Google App Password for pitstopsupport@gmail.com.

---

## Priority 3 — Post-Deployment Verification Checkpoints

Run all 7 remaining checkpoints in order:

- [ ] Backend health — open https://pitstop-production-a67e.up.railway.app/api/accounts/me → must return 401 (not 503)
- [ ] CORS works — login from Vercel frontend must succeed (no CORS error in console)
- [ ] Email delivery — register new account, verify email arrives and link works
- [ ] WebSocket — DevTools → Network → WS tab → must show active wss:// connection after login
- [ ] Cloudinary — upload a profile photo, confirm it saves and displays
- [ ] Full broadcast flow — two browser tabs (user + mechanic), send SOS, confirm real-time broadcast, accept, status changes
- [ ] Mechanic GPS — confirm live distance updates in ActiveJobFloat during an active job

---

## Long-Term — Oracle Cloud Always Free (3-4 hours when time allows)

Railway trial ends in 30 days. Oracle Cloud Always Free is the permanent hosting solution (free forever, 4 ARM OCPUs, 24GB RAM).

Steps:
1. Create Oracle Cloud account (Always Free tier)
2. Provision ARM VM (Ubuntu 22.04)
3. Install Java 21, PostgreSQL 15, Maven
4. Create pitstop DB + user
5. Clone repo, build JAR
6. Create systemd service for auto-restart
7. Install Nginx as reverse proxy (port 80/443 → 8080)
8. Register DuckDNS subdomain (free)
9. Issue Let's Encrypt SSL via certbot
10. Update Vercel VITE_API_BASE_URL → new domain
11. Update Railway CORS_ALLOWED_ORIGINS → new domain (or decommission Railway)

---

## Post-Deployment Feature — N1 (Live Mechanic Map)

mechanicLat/mechanicLng are already in JobResponseDto. Add after all verification passes.
