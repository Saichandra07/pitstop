import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// ─── Problem lists per wheeler ────────────────────────────────────────────────

const PROBLEMS = {
  TWO_WHEELER: [
    { value: "BATTERY_DEAD",          label: "Battery dead",             emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",    label: "Engine overheating",       emoji: "🌡️" },
    { value: "ENGINE_WONT_START",     label: "Won't start",              emoji: "🔑" },
    { value: "ENGINE_NOISE",          label: "Engine noise",             emoji: "🔊" },
    { value: "OIL_LEAK",              label: "Oil leak",                 emoji: "🛢️" },
    { value: "FLAT_TYRE",             label: "Flat tyre",                emoji: "🫧" },
    { value: "TYRE_BURST",            label: "Tyre burst",               emoji: "💥" },
    { value: "CHAIN_SNAPPED",         label: "Chain snapped",            emoji: "⛓️" },
    { value: "BRAKE_FAILURE",         label: "Brake failure",            emoji: "🛑" },
    { value: "BRAKE_NOISE",           label: "Brake noise",              emoji: "📢" },
    { value: "CLUTCH_FAILURE",        label: "Clutch failure",           emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",     label: "Suspension",               emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING",label: "Headlights",               emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",       label: "Accident damage",          emoji: "🚨" },
    { value: "VEHICLE_STUCK",         label: "Vehicle stuck",            emoji: "😵" },
    { value: "STRANGE_NOISE",         label: "Strange noise",            emoji: "❓" },
    { value: "DONT_KNOW",             label: "Don't know — just come",   emoji: "🆘" },
  ],
  THREE_WHEELER: [
    { value: "BATTERY_DEAD",          label: "Battery dead",             emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",    label: "Engine overheating",       emoji: "🌡️" },
    { value: "ENGINE_WONT_START",     label: "Won't start",              emoji: "🔑" },
    { value: "ENGINE_NOISE",          label: "Engine noise",             emoji: "🔊" },
    { value: "OIL_LEAK",              label: "Oil leak",                 emoji: "🛢️" },
    { value: "FLAT_TYRE",             label: "Flat tyre",                emoji: "🫧" },
    { value: "TYRE_BURST",            label: "Tyre burst",               emoji: "💥" },
    { value: "BRAKE_FAILURE",         label: "Brake failure",            emoji: "🛑" },
    { value: "BRAKE_NOISE",           label: "Brake noise",              emoji: "📢" },
    { value: "CLUTCH_FAILURE",        label: "Clutch failure",           emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",     label: "Suspension",               emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING",label: "Headlights",               emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",       label: "Accident damage",          emoji: "🚨" },
    { value: "VEHICLE_STUCK",         label: "Vehicle stuck",            emoji: "😵" },
    { value: "STRANGE_NOISE",         label: "Strange noise",            emoji: "❓" },
    { value: "GEAR_STUCK",            label: "Gear stuck",               emoji: "⚙️" },
    { value: "STEERING_LOCKED",       label: "Steering locked",          emoji: "🔒" },
    { value: "DONT_KNOW",             label: "Don't know — just come",   emoji: "🆘" },
  ],
  FOUR_WHEELER: [
    { value: "BATTERY_DEAD",          label: "Battery dead",             emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",    label: "Engine overheating",       emoji: "🌡️" },
    { value: "ENGINE_WONT_START",     label: "Won't start",              emoji: "🔑" },
    { value: "ENGINE_NOISE",          label: "Engine noise",             emoji: "🔊" },
    { value: "OIL_LEAK",             label: "Oil leak",                  emoji: "🛢️" },
    { value: "FLAT_TYRE",             label: "Flat tyre",                emoji: "🫧" },
    { value: "TYRE_BURST",            label: "Tyre burst",               emoji: "💥" },
    { value: "BRAKE_FAILURE",         label: "Brake failure",            emoji: "🛑" },
    { value: "BRAKE_NOISE",           label: "Brake noise",              emoji: "📢" },
    { value: "CLUTCH_FAILURE",        label: "Clutch failure",           emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",     label: "Suspension",               emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING",label: "Headlights",               emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",       label: "Accident damage",          emoji: "🚨" },
    { value: "VEHICLE_STUCK",         label: "Vehicle stuck",            emoji: "😵" },
    { value: "STRANGE_NOISE",         label: "Strange noise",            emoji: "❓" },
    { value: "GEAR_STUCK",            label: "Gear stuck",               emoji: "⚙️" },
    { value: "STEERING_LOCKED",       label: "Steering locked",          emoji: "🔒" },
    { value: "WARNING_LIGHT",         label: "Warning light",            emoji: "⚠️" },
    { value: "DONT_KNOW",             label: "Don't know — just come",   emoji: "🆘" },
  ],
  SIX_PLUS_WHEELER: [
    { value: "BATTERY_DEAD",          label: "Battery dead",             emoji: "🔋" },
    { value: "ENGINE_OVERHEATING",    label: "Engine overheating",       emoji: "🌡️" },
    { value: "ENGINE_WONT_START",     label: "Won't start",              emoji: "🔑" },
    { value: "ENGINE_NOISE",          label: "Engine noise",             emoji: "🔊" },
    { value: "OIL_LEAK",             label: "Oil leak",                  emoji: "🛢️" },
    { value: "FLAT_TYRE",             label: "Flat tyre",                emoji: "🫧" },
    { value: "TYRE_BURST",            label: "Tyre burst",               emoji: "💥" },
    { value: "BRAKE_FAILURE",         label: "Brake failure",            emoji: "🛑" },
    { value: "BRAKE_NOISE",           label: "Brake noise",              emoji: "📢" },
    { value: "CLUTCH_FAILURE",        label: "Clutch failure",           emoji: "🔧" },
    { value: "SUSPENSION_DAMAGE",     label: "Suspension",               emoji: "🪝" },
    { value: "HEADLIGHTS_NOT_WORKING",label: "Headlights",               emoji: "💡" },
    { value: "ACCIDENT_DAMAGE",       label: "Accident damage",          emoji: "🚨" },
    { value: "VEHICLE_STUCK",         label: "Vehicle stuck",            emoji: "😵" },
    { value: "STRANGE_NOISE",         label: "Strange noise",            emoji: "❓" },
    { value: "GEAR_STUCK",            label: "Gear stuck",               emoji: "⚙️" },
    { value: "STEERING_LOCKED",       label: "Steering locked",          emoji: "🔒" },
    { value: "WARNING_LIGHT",         label: "Warning light",            emoji: "⚠️" },
    { value: "DONT_KNOW",             label: "Don't know — just come",   emoji: "🆘" },
  ],
};

const WHEELERS = [
  { value: "TWO_WHEELER",      label: "2-Wheeler",   sub: "Bike, Scooter",        emoji: "🛵" },
  { value: "THREE_WHEELER",    label: "3-Wheeler",   sub: "Auto, Tempo",          emoji: "🛺" },
  { value: "FOUR_WHEELER",     label: "4-Wheeler",   sub: "Car, SUV, Van",        emoji: "🚗" },
  { value: "SIX_PLUS_WHEELER", label: "6-Wheeler+",  sub: "Truck, Bus, Lorry",    emoji: "🚛" },
];

const DRAFT_KEY = "pitstop_sos_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: s < step ? "#61cd96" : s === step ? "#E63946" : "#2a2a2a",
          transition: "background 0.25s",
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SOSWizardPage() {
  const navigate = useNavigate();

  // Restore draft on mount
  const [step, setStep]       = useState(1);
  const [draft, setDraft]     = useState(loadDraft);

  // GPS state
  const [gpsReady, setGpsReady]     = useState(false);
  const [gpsError, setGpsError]     = useState(false);
  const [coords, setCoords]         = useState(null);

  // Step 3 UI state
  const [vehicleName, setVehicleName] = useState(draft.vehicleName || "");
  const [description, setDescription] = useState(draft.description || "");
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(draft.photoUrl || null);
  const [photoUrl, setPhotoUrl]       = useState(draft.photoUrl || null);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const fileInputRef = useRef();

  // ── GPS: start silently on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError(true); return; }

    // Try high accuracy first (satellite)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsReady(true);
      },
      () => {
        // Fallback: low accuracy (cell/WiFi)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsReady(true);
          },
          () => setGpsError(true),
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Persist draft on every change ─────────────────────────────────────────
  useEffect(() => {
    saveDraft({ ...draft, vehicleName, description, photoUrl });
  }, [draft, vehicleName, description, photoUrl]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function selectWheeler(value) {
    const next = { ...draft, wheeler: value, problem: null };
    setDraft(next);
    setStep(2);
  }

  function selectProblem(value) {
    setDraft(d => ({ ...d, problem: value }));
  }

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
      const res = await api.post("/jobs/upload-photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUrl(res.data);
    } catch {
      setError("Photo upload failed. You can still send SOS without a photo.");
      setPhotoUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if (!vehicleName.trim()) { setError("Vehicle name is required."); return; }
    if (!gpsReady && !gpsError) { setError("Waiting for GPS..."); return; }
    if (uploading) { setError("Photo is still uploading, please wait."); return; }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/jobs/sos", {
        vehicleType:  draft.wheeler,
        problemType:  draft.problem,
        vehicleName:  vehicleName.trim(),
        description:  description.trim() || null,
        latitude:     coords?.lat || 0,
        longitude:    coords?.lng || 0,
        address:      null,
        photoUrl:     photoUrl || null,
      });
      clearDraft();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send SOS. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    clearDraft();
    navigate("/dashboard");
  }

  const canSend = vehicleName.trim() && gpsReady && !uploading && !submitting;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#141414",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 40px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        padding: "20px 20px 0",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* ── Topbar ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginBottom: step > 1 ? 12 : 24,
        }}>
          {/* Left: logo always */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "#E63946",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L2 4.5V13h3.5V9h3v4H12V4.5L7 1Z" fill="#fff"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
              PitStop
            </span>
          </div>

          {/* Center: step indicator */}
          <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
            Step {step} of 3
          </span>

          {/* Right: cancel */}
          <button
            onClick={handleCancel}
            style={{
              background: "none", border: "none",
              color: "#555", fontSize: 13, cursor: "pointer", padding: 0,
            }}
          >Cancel</button>
        </div>

        {/* ── Back button (steps 2-3 only) ── */}
        {step > 1 && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#242424", border: "none",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >‹</button>
          </div>
        )}

        {/* ── Progress bar ── */}
        <ProgressBar step={step} />

        {/* ══════════════════════════════════════════
            STEP 1 — Wheeler
        ══════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.3px" }}>
                What type of vehicle?
              </h2>
              <p style={{ fontSize: 13, color: "#555" }}>Tap to continue</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {WHEELERS.map(w => (
                <button
                  key={w.value}
                  onClick={() => selectWheeler(w.value)}
                  style={{
                    width: "100%",
                    background: draft.wheeler === w.value ? "rgba(230,57,70,0.08)" : "#1a1a1a",
                    border: `0.5px solid ${draft.wheeler === w.value ? "#E63946" : "#242424"}`,
                    borderRadius: 16,
                    padding: "18px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{w.emoji}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 3 }}>
                      {w.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#555" }}>{w.sub}</div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    width: 20, height: 20, borderRadius: "50%",
                    border: `1.5px solid ${draft.wheeler === w.value ? "#E63946" : "#333"}`,
                    background: draft.wheeler === w.value ? "#E63946" : "transparent",
                    flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {draft.wheeler === w.value && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — Problem
        ══════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.3px" }}>
                What's the issue?
              </h2>
              <p style={{ fontSize: 13, color: "#555" }}>Select one problem</p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              overflowY: "auto",
              flex: 1,
              paddingBottom: draft.problem ? 80 : 16,
              maxHeight: "calc(100dvh - 280px)",
            }}>
              {(PROBLEMS[draft.wheeler] || []).map(p => (
                <button
                  key={p.value}
                  onClick={() => selectProblem(p.value)}
                  style={{
                    background: draft.problem === p.value ? "rgba(230,57,70,0.08)" : "#1a1a1a",
                    border: `0.5px solid ${draft.problem === p.value ? "#E63946" : "#242424"}`,
                    borderRadius: 14,
                    padding: "16px 12px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{p.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: draft.problem === p.value ? "#fff" : "#888", lineHeight: 1.3 }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Next button — appears after selection */}
            {draft.problem && (
              <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                padding: "16px 20px 32px",
                background: "linear-gradient(0deg, #141414 60%, transparent)",
              }}>
                <div style={{ maxWidth: 480, margin: "0 auto" }}>
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      width: "100%", height: 52, borderRadius: 14,
                      background: "#E63946", border: "none",
                      color: "#fff", fontSize: 15, fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — Details
        ══════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "-0.3px" }}>
                A few details
              </h2>
              <p style={{ fontSize: 13, color: "#555" }}>Help your mechanic come prepared</p>
            </div>

            {/* Vehicle name — required */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 500, display: "block", marginBottom: 7 }}>
                Vehicle name <span style={{ color: "#E63946" }}>*</span>
              </label>
              <input
                value={vehicleName}
                onChange={e => setVehicleName(e.target.value)}
                placeholder="Honda Activa, Swift Dzire..."
                style={{
                  width: "100%", height: 48, borderRadius: 12,
                  background: "#1a1a1a",
                  border: `0.5px solid ${vehicleName.trim() ? "#333" : "#242424"}`,
                  color: "#fff", fontSize: 14, padding: "0 14px",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Description — optional */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 500, display: "block", marginBottom: 7 }}>
                Description <span style={{ color: "#444" }}>(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any details that might help..."
                rows={3}
                style={{
                  width: "100%", borderRadius: 12,
                  background: "#1a1a1a", border: "0.5px solid #242424",
                  color: "#fff", fontSize: 14, padding: "12px 14px",
                  outline: "none", resize: "none", boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {/* Photo — optional */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 500, display: "block", marginBottom: 7 }}>
                Photo <span style={{ color: "#444" }}>(optional)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />

              {!photoPreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%", height: 80, borderRadius: 12,
                    background: "#1a1a1a", border: "0.5px dashed #333",
                    color: "#555", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📷</span>
                  Add a photo
                </button>
              ) : (
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                  <img
                    src={photoPreview}
                    alt="preview"
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block", borderRadius: 12 }}
                  />
                  {uploading && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#fff", borderRadius: 12,
                    }}>
                      Uploading...
                    </div>
                  )}
                  {!uploading && (
                    <button
                      onClick={removePhoto}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)", border: "none",
                        color: "#fff", fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>
                  )}
                </div>
              )}
            </div>

            {/* GPS status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 10,
              background: gpsReady ? "rgba(97,205,150,0.06)" : gpsError ? "rgba(230,57,70,0.06)" : "rgba(250,199,117,0.06)",
              border: `0.5px solid ${gpsReady ? "rgba(97,205,150,0.2)" : gpsError ? "rgba(230,57,70,0.2)" : "rgba(250,199,117,0.2)"}`,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 14 }}>
                {gpsReady ? "📍" : gpsError ? "⚠️" : "⏳"}
              </span>
              <span style={{
                fontSize: 12,
                color: gpsReady ? "#61cd96" : gpsError ? "#E63946" : "#FAC775",
                fontWeight: 500,
              }}>
                {gpsReady
                  ? "Location captured"
                  : gpsError
                  ? "Location unavailable — enable GPS in settings"
                  : "Getting your location..."}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(230,57,70,0.08)", border: "0.5px solid rgba(230,57,70,0.2)",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: "#E63946", marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Send SOS button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: "100%", height: 56, borderRadius: 14,
                background: canSend ? "#E63946" : "#2a2a2a",
                border: "none",
                color: canSend ? "#fff" : "#555",
                fontSize: 16, fontWeight: 700,
                cursor: canSend ? "pointer" : "not-allowed",
                transition: "background 0.2s, color 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {submitting ? "Sending..." : "🆘 Send SOS"}
            </button>

            {/* Hint when button is disabled */}
            {!canSend && !submitting && (
              <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 10 }}>
                {!vehicleName.trim()
                  ? "Enter your vehicle name to continue"
                  : !gpsReady
                  ? "Waiting for GPS..."
                  : uploading
                  ? "Photo uploading..."
                  : ""}
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
}