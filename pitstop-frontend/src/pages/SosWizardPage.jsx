// src/pages/SOSWizardPage.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import TopBar from "../components/TopBar";
import OptionCard from "../components/OptionCard";
import ProgressBar from "../components/ProgressBar";
import { useActiveJob } from "../context/ActiveJobContext";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROBLEMS = {
  TWO_WHEELER: [
    { value: "BATTERY_DEAD",           label: "Battery dead",           sublabel: "Dead / weak",      emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",     label: "Engine",                 sublabel: "Overheating",      emoji: "🌡️" },
    { value: "ENGINE_WONT_START",      label: "Won't start",            sublabel: "No crank / stall", emoji: "🔑" },
    { value: "ENGINE_NOISE",           label: "Engine noise",           sublabel: "Knock / rattle",   emoji: "🔊" },
    { value: "OIL_LEAK",               label: "Oil leak",               sublabel: "Dripping / burn",  emoji: "🛢️" },
    { value: "FLAT_TYRE",              label: "Flat tyre",              sublabel: "Puncture",         emoji: "🫧" },
    { value: "TYRE_BURST",             label: "Tyre burst",             sublabel: "Blowout",          emoji: "💥" },
    { value: "CHAIN_SNAPPED",          label: "Chain snapped",          sublabel: "Broken / off",     emoji: "⛓️" },
    { value: "BRAKE_FAILURE",          label: "Brake failure",          sublabel: "No response",      emoji: "🛑" },
    { value: "BRAKE_NOISE",            label: "Brake noise",            sublabel: "Squeal / grind",   emoji: "📢" },
    { value: "CLUTCH_FAILURE",         label: "Clutch",                 sublabel: "Slipping / stuck", emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",      label: "Suspension",             sublabel: "Rough / noise",    emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING", label: "Headlights",             sublabel: "Not working",      emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",        label: "Accident",               sublabel: "Minor damage",     emoji: "🚨" },
    { value: "VEHICLE_STUCK",          label: "Vehicle stuck",          sublabel: "Can't move",       emoji: "😵" },
    { value: "STRANGE_NOISE",          label: "Strange noise",          sublabel: "Noise / smell",    emoji: "❓" },
    { value: "DONT_KNOW",              label: "Don't know",             sublabel: "Just come",        emoji: "🆘" },
  ],
  THREE_WHEELER: [
    { value: "BATTERY_DEAD",           label: "Battery dead",           sublabel: "Dead / weak",      emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",     label: "Engine",                 sublabel: "Overheating",      emoji: "🌡️" },
    { value: "ENGINE_WONT_START",      label: "Won't start",            sublabel: "No crank / stall", emoji: "🔑" },
    { value: "ENGINE_NOISE",           label: "Engine noise",           sublabel: "Knock / rattle",   emoji: "🔊" },
    { value: "OIL_LEAK",               label: "Oil leak",               sublabel: "Dripping / burn",  emoji: "🛢️" },
    { value: "FLAT_TYRE",              label: "Flat tyre",              sublabel: "Puncture",         emoji: "🫧" },
    { value: "TYRE_BURST",             label: "Tyre burst",             sublabel: "Blowout",          emoji: "💥" },
    { value: "BRAKE_FAILURE",          label: "Brake failure",          sublabel: "No response",      emoji: "🛑" },
    { value: "BRAKE_NOISE",            label: "Brake noise",            sublabel: "Squeal / grind",   emoji: "📢" },
    { value: "CLUTCH_FAILURE",         label: "Clutch",                 sublabel: "Slipping / stuck", emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",      label: "Suspension",             sublabel: "Rough / noise",    emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING", label: "Headlights",             sublabel: "Not working",      emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",        label: "Accident",               sublabel: "Minor damage",     emoji: "🚨" },
    { value: "VEHICLE_STUCK",          label: "Vehicle stuck",          sublabel: "Can't move",       emoji: "😵" },
    { value: "STRANGE_NOISE",          label: "Strange noise",          sublabel: "Noise / smell",    emoji: "❓" },
    { value: "GEAR_STUCK",             label: "Gear stuck",             sublabel: "Won't shift",      emoji: "⚙️" },
    { value: "STEERING_LOCKED",        label: "Steering",               sublabel: "Locked / heavy",   emoji: "🔒" },
    { value: "DONT_KNOW",              label: "Don't know",             sublabel: "Just come",        emoji: "🆘" },
  ],
  FOUR_WHEELER: [
    { value: "BATTERY_DEAD",           label: "Battery dead",           sublabel: "Dead / weak",      emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",     label: "Engine",                 sublabel: "Overheating",      emoji: "🌡️" },
    { value: "ENGINE_WONT_START",      label: "Won't start",            sublabel: "No crank / stall", emoji: "🔑" },
    { value: "ENGINE_NOISE",           label: "Engine noise",           sublabel: "Knock / rattle",   emoji: "🔊" },
    { value: "OIL_LEAK",               label: "Oil leak",               sublabel: "Dripping / burn",  emoji: "🛢️" },
    { value: "FLAT_TYRE",              label: "Flat tyre",              sublabel: "Puncture",         emoji: "🫧" },
    { value: "TYRE_BURST",             label: "Tyre burst",             sublabel: "Blowout",          emoji: "💥" },
    { value: "BRAKE_FAILURE",          label: "Brake failure",          sublabel: "No response",      emoji: "🛑" },
    { value: "BRAKE_NOISE",            label: "Brake noise",            sublabel: "Squeal / grind",   emoji: "📢" },
    { value: "CLUTCH_FAILURE",         label: "Clutch",                 sublabel: "Slipping / stuck", emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",      label: "Suspension",             sublabel: "Rough / noise",    emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING", label: "Headlights",             sublabel: "Not working",      emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",        label: "Accident",               sublabel: "Minor damage",     emoji: "🚨" },
    { value: "VEHICLE_STUCK",          label: "Vehicle stuck",          sublabel: "Can't move",       emoji: "😵" },
    { value: "STRANGE_NOISE",          label: "Strange noise",          sublabel: "Noise / smell",    emoji: "❓" },
    { value: "GEAR_STUCK",             label: "Gear stuck",             sublabel: "Won't shift",      emoji: "⚙️" },
    { value: "STEERING_LOCKED",        label: "Steering",               sublabel: "Locked / heavy",   emoji: "🔒" },
    { value: "WARNING_LIGHT",          label: "Warning light",          sublabel: "Dashboard",        emoji: "⚠️" },
    { value: "DONT_KNOW",              label: "Don't know",             sublabel: "Just come",        emoji: "🆘" },
  ],
  SIX_PLUS_WHEELER: [
    { value: "BATTERY_DEAD",           label: "Battery dead",           sublabel: "Dead / weak",      emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",     label: "Engine",                 sublabel: "Overheating",      emoji: "🌡️" },
    { value: "ENGINE_WONT_START",      label: "Won't start",            sublabel: "No crank / stall", emoji: "🔑" },
    { value: "ENGINE_NOISE",           label: "Engine noise",           sublabel: "Knock / rattle",   emoji: "🔊" },
    { value: "OIL_LEAK",               label: "Oil leak",               sublabel: "Dripping / burn",  emoji: "🛢️" },
    { value: "FLAT_TYRE",              label: "Flat tyre",              sublabel: "Puncture",         emoji: "🫧" },
    { value: "TYRE_BURST",             label: "Tyre burst",             sublabel: "Blowout",          emoji: "💥" },
    { value: "BRAKE_FAILURE",          label: "Brake failure",          sublabel: "No response",      emoji: "🛑" },
    { value: "BRAKE_NOISE",            label: "Brake noise",            sublabel: "Squeal / grind",   emoji: "📢" },
    { value: "CLUTCH_FAILURE",         label: "Clutch",                 sublabel: "Slipping / stuck", emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",      label: "Suspension",             sublabel: "Rough / noise",    emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING", label: "Headlights",             sublabel: "Not working",      emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",        label: "Accident",               sublabel: "Minor damage",     emoji: "🚨" },
    { value: "VEHICLE_STUCK",          label: "Vehicle stuck",          sublabel: "Can't move",       emoji: "😵" },
    { value: "STRANGE_NOISE",          label: "Strange noise",          sublabel: "Noise / smell",    emoji: "❓" },
    { value: "GEAR_STUCK",             label: "Gear stuck",             sublabel: "Won't shift",      emoji: "⚙️" },
    { value: "STEERING_LOCKED",        label: "Steering",               sublabel: "Locked / heavy",   emoji: "🔒" },
    { value: "WARNING_LIGHT",          label: "Warning light",          sublabel: "Dashboard",        emoji: "⚠️" },
    { value: "DONT_KNOW",              label: "Don't know",             sublabel: "Just come",        emoji: "🆘" },
  ],
};

const WHEELERS = [
  { value: "TWO_WHEELER",      label: "2-Wheeler",  sub: "Bike, Scooter",     emoji: "🛵" },
  { value: "THREE_WHEELER",    label: "3-Wheeler",  sub: "Auto, Tempo",       emoji: "🛺" },
  { value: "FOUR_WHEELER",     label: "4-Wheeler",  sub: "Car, SUV, Van",     emoji: "🚗" },
  { value: "SIX_PLUS_WHEELER", label: "6-Wheeler+", sub: "Truck, Bus, Lorry", emoji: "🚛" },
];

const DRAFT_KEY = "pitstop_sos_draft";
function loadDraft() { try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch {} }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SOSWizardPage() {
  const navigate = useNavigate();
  const { activeJob, refetchActiveJob } = useActiveJob();

  // Guard: if an active job exists (or appears mid-wizard), go back to dashboard
  useEffect(() => {
    if (activeJob) navigate("/dashboard", { replace: true });
  }, [activeJob, navigate]);

  const [step, setStep]   = useState(1);
  const [draft, setDraft] = useState(loadDraft);

  const [gpsReady, setGpsReady] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [coords, setCoords]     = useState(null);

  const [vehicleName,   setVehicleName]   = useState(draft.vehicleName || "");
  const [description,   setDescription]   = useState(draft.description || "");
  const [photoFile,     setPhotoFile]     = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(draft.photoUrl || null);
  const [photoUrl,      setPhotoUrl]      = useState(draft.photoUrl || null);
  const [uploading,     setUploading]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");

  const fileInputRef = useRef();

  // GPS — silent capture from Step 1
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsReady(true); },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsReady(true); },
          () => setGpsError(true),
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Persist draft
  useEffect(() => { saveDraft({ ...draft, vehicleName, description, photoUrl }); }, [draft, vehicleName, description, photoUrl]);

  function selectWheeler(value) { setDraft({ ...draft, wheeler: value, problem: null }); setStep(2); }
  function selectProblem(value) { setDraft(d => ({ ...d, problem: value })); }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/jobs/upload-photo", form, { headers: { "Content-Type": "multipart/form-data" } });
      setPhotoUrl(res.data);
    } catch {
      setError("Photo upload failed. You can still send SOS without a photo.");
      setPhotoUrl(null);
    } finally { setUploading(false); }
  }

  function removePhoto() {
    setPhotoFile(null); setPhotoPreview(null); setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if (!vehicleName.trim()) { setError("Vehicle name is required."); return; }
    if (!gpsReady && !gpsError) { setError("Waiting for GPS..."); return; }
    if (uploading) { setError("Photo is still uploading, please wait."); return; }
    setSubmitting(true); setError("");
    try {
      await api.post("/jobs/sos", {
        vehicleType: draft.wheeler,
        problemType: draft.problem,
        vehicleName: vehicleName.trim(),
        description: description.trim() || null,
        latitude:    coords?.lat || 0,
        longitude:   coords?.lng || 0,
        address:     null,
        photoUrl:    photoUrl || null,
      });
      clearDraft();
      // Populate context before navigating — float appears instantly, no gap
      await refetchActiveJob();
      navigate("/dashboard");
      // Component unmounts on navigate; no need to reset submitting on success
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send SOS. Please try again.");
      setSubmitting(false);
    }
  }

  function handleCancel() { clearDraft(); navigate("/dashboard"); }

  const canSend = vehicleName.trim() && gpsReady && !uploading && !submitting;

  // ─── Shared TopBar cancel button ─────────────────────────────────────────
  const CancelBtn = (
    <button
      onClick={handleCancel}
      style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 }}
    >
      Cancel
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  // Full-screen loading overlay while SOS is submitting + fetching active job.
  // Blocks all interaction so nothing can be tapped during the transition.
  if (submitting) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(230,57,70,0.1)", border: "1.5px solid var(--red)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"
              stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <div className="ps-spinner" />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Sending SOS…</p>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Finding mechanics near you</p>
      </div>
    );
  }

  return (
    <div className="ps-screen" style={{ paddingBottom: 0, overflow: "hidden", height: "100dvh" }}>

      {/* ══════════════════════════════════════════
          STEP 1 — Wheeler type
      ══════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <TopBar
            centerContent={
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.5px" }}>
                Step 1 of 3
              </span>
            }
            rightContent={CancelBtn}
          />

          <ProgressBar steps={3} current={1} />

          <div style={{ marginBottom: 24, marginTop: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
              What type of vehicle?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Tap to continue</p>
          </div>

          {/* Horizontal wheeler list — intentionally not OptionCard (list layout is better UX here) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {WHEELERS.map(w => (
              <button
                key={w.value}
                onClick={() => selectWheeler(w.value)}
                style={{
                  width: "100%",
                  background: draft.wheeler === w.value ? "rgba(230,57,70,0.08)" : "var(--surface)",
                  border: `1px solid ${draft.wheeler === w.value ? "var(--red)" : "var(--border)"}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer",
                  transition: "border-color var(--t-base), background var(--t-base)",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{w.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{w.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{w.sub}</div>
                </div>
                {/* Radio dot */}
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `1.5px solid ${draft.wheeler === w.value ? "var(--red)" : "var(--border)"}`,
                  background: draft.wheeler === w.value ? "var(--red)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background var(--t-base), border-color var(--t-base)",
                }}>
                  {draft.wheeler === w.value && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 2 — Problem
      ══════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <TopBar
            centerContent={
              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.5px" }}>
                Step 2 of 3
              </span>
            }
            rightContent={CancelBtn}
            showBack
            onBack={() => setStep(1)}
          />

          <ProgressBar steps={3} current={2} />

          <div style={{ marginBottom: 16, marginTop: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
              What's the issue?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Select one problem</p>
          </div>

          {/* Scrollable problem grid */}
          <div className="ps-scroll-hide" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            overflowY: "auto",
            flex: 1,
            paddingBottom: draft.problem ? 88 : 16,
          }}>
            {(PROBLEMS[draft.wheeler] || []).map(p => (
              <OptionCard
                key={p.value}
                icon={p.emoji}
                label={p.label}
                sublabel={p.sublabel}
                selected={draft.problem === p.value}
                onClick={() => selectProblem(p.value)}
              />
            ))}
          </div>

          {/* Fixed bottom CTA — matches mockup exactly */}
          {draft.problem && (
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              padding: "16px 16px 32px",
              background: "linear-gradient(0deg, var(--bg) 65%, transparent)",
              zIndex: 30,
            }}>
              <button
                onClick={() => setStep(3)}
                className="ps-btn"
                style={{ borderRadius: 14, fontSize: 15, height: 52 }}
              >
                Broadcast SOS →
              </button>
              <p style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center", marginTop: 8, letterSpacing: "0.3px" }}>
                Your location is shared only with verified mechanics
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 3 — Details
      ══════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Fixed header */}
          <div style={{ flexShrink: 0 }}>
            <TopBar
              centerContent={
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.5px" }}>
                  Step 3 of 3
                </span>
              }
              rightContent={CancelBtn}
              showBack
              onBack={() => setStep(2)}
            />
            <ProgressBar steps={3} current={3} />
            <div style={{ marginBottom: 16, marginTop: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
                A few details
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Help your mechanic come prepared</p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="ps-scroll-hide" style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>

            {/* Vehicle name */}
            <div className="ps-field">
              <label className="ps-label">
                Vehicle name <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input
                className="ps-input"
                value={vehicleName}
                onChange={e => setVehicleName(e.target.value)}
                placeholder="Honda Activa, Swift Dzire..."
              />
            </div>

            {/* Description */}
            <div className="ps-field">
              <label className="ps-label">
                Description <span style={{ color: "var(--text-3)" }}>(optional)</span>
              </label>
              <textarea
                className="ps-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any details that might help..."
                rows={3}
                style={{ resize: "none", fontFamily: "var(--font)", lineHeight: 1.5 }}
              />
            </div>

            {/* Photo */}
            <div className="ps-field">
              <label className="ps-label">
                Photo <span style={{ color: "var(--text-3)" }}>(optional)</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              {!photoPreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%", height: 76, borderRadius: 10,
                    background: "var(--surface2)", border: "1px dashed var(--border)",
                    color: "var(--text-3)", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📷</span> Add a photo
                </button>
              ) : (
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
                  <img src={photoPreview} alt="preview" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                  {uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="ps-spinner" />
                    </div>
                  )}
                  {!uploading && (
                    <button onClick={removePhoto} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "var(--text)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  )}
                </div>
              )}
            </div>

            {/* GPS status bar */}
            <div className="ps-gps-bar" style={{ marginBottom: 16 }}>
              <div className={`ps-gps-dot${gpsReady ? "" : gpsError ? "" : " searching"}`}
                style={gpsError ? { background: "var(--red)", boxShadow: "0 0 0 3px var(--red-soft)" } : {}} />
              <div>
                <div className="ps-gps-label">{gpsReady ? "Location" : gpsError ? "Location" : "Location"}</div>
                <div className="ps-gps-value" style={{ color: gpsReady ? "var(--green)" : gpsError ? "var(--red)" : "var(--gold)" }}>
                  {gpsReady ? "📍 Captured" : gpsError ? "⚠️ Enable GPS in settings" : "⏳ Getting location..."}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && <div className="ps-alert ps-alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          </div>

          {/* Sticky footer */}
          <div style={{ flexShrink: 0, paddingTop: 12, paddingBottom: 8 }}>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="ps-btn"
              style={{ height: 56, fontSize: 15, borderRadius: 14, opacity: canSend ? 1 : 0.4, cursor: canSend ? "pointer" : "not-allowed" }}
            >
              {submitting ? <><span className="ps-spinner" style={{ width: 16, height: 16, borderWidth: 2, display: "inline-block", marginRight: 8 }} />Sending...</> : "🆘 Send SOS"}
            </button>
            {!canSend && !submitting && (
              <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                {!vehicleName.trim() ? "Enter your vehicle name to continue" : !gpsReady ? "Waiting for GPS..." : uploading ? "Photo uploading..." : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}