import { useState, useEffect, useRef } from "react";
import { useChatMessages } from "../hooks/useChatMessages";

// role: "USER" | "MECHANIC" — determines which bubbles are on the right
export default function ChatOverlay({ jobId, role, onClose }) {
  const { messages, send, markRead } = useChatMessages(jobId);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { markRead(); }, [markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    send(trimmed);
    setInput("");
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 56, zIndex: 99,
      background: "var(--bg)", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}
        >←</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Chat</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>Messages are visible to both parties</div>
        </div>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, marginTop: 60 }}>
            No messages yet — say hello!
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.senderRole === role;
          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: mine ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}>
              <div style={{
                maxWidth: "75%",
                background: mine ? "var(--gold)" : "var(--surface2)",
                color: mine ? "#0A0A0F" : "var(--text)",
                borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "8px 12px",
                fontSize: 13,
                lineHeight: 1.45,
              }}>
                <div>{msg.body}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: mine ? "right" : "left" }}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px 14px", borderTop: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          style={{
            flex: 1, background: "var(--surface2)",
            border: "1px solid var(--border)", borderRadius: 24,
            padding: "10px 16px", color: "var(--text)", fontSize: 14, outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: input.trim() ? "var(--gold)" : "var(--surface3)",
            cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
              stroke={input.trim() ? "#0A0A0F" : "var(--text-3)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
