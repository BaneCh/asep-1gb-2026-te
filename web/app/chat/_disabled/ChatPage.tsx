"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Πόσοι διορίστηκαν στην ΤΕ Πληροφορικής;",
  "Ποια είναι η μέση βαθμολογία;",
  "Ποια ειδικότητα έχει το μεγαλύτερο ποσοστό επιτυχίας;",
  "Πότε λήγουν οι ενστάσεις;",
];

// === Markdown-like renderer ===
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Regex: **bold** | `code` | [text](url)
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const m = match[0];

    if (m.startsWith("**")) {
      parts.push(
        <strong
          key={key++}
          style={{ color: "var(--primary)", fontWeight: 700 }}
        >
          {m.slice(2, -2)}
        </strong>
      );
    } else if (m.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          style={{
            background: "rgba(0, 229, 255, 0.1)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.9em",
            color: "var(--primary)",
          }}
        >
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[")) {
      const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <Link
            key={key++}
            href={linkMatch[2]}
            style={{
              color: "var(--primary)",
              textDecoration: "underline",
              textDecorationColor: "rgba(0, 229, 255, 0.4)",
              textUnderlineOffset: "3px",
              fontWeight: 600,
            }}
          >
            {linkMatch[1]}
          </Link>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function renderMessage(content: string): React.ReactNode {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Empty line → spacer
    if (!line.trim()) {
      elements.push(<div key={`sp-${lineIdx}`} style={{ height: "10px" }} />);
      return;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <div
          key={lineIdx}
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--primary)",
            marginTop: "12px",
            marginBottom: "6px",
          }}
        >
          {renderInline(line.substring(4))}
        </div>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <div
          key={lineIdx}
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--primary)",
            marginTop: "14px",
            marginBottom: "8px",
          }}
        >
          {renderInline(line.substring(3))}
        </div>
      );
      return;
    }

    // Bullets
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const text = line.trim().replace(/^[-•]\s+/, "");
      elements.push(
        <div
          key={lineIdx}
          style={{
            paddingLeft: "20px",
            position: "relative",
            marginBottom: "6px",
            lineHeight: 1.65,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "4px",
              color: "var(--primary)",
            }}
          >
            •
          </span>
          {renderInline(text)}
        </div>
      );
      return;
    }

    // Numbered items
    const numMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div
          key={lineIdx}
          style={{
            paddingLeft: "26px",
            position: "relative",
            marginBottom: "6px",
            lineHeight: 1.65,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "0",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.9em",
            }}
          >
            {numMatch[1]}.
          </span>
          {renderInline(numMatch[2])}
        </div>
      );
      return;
    }

    // Normal paragraph
    elements.push(
      <div key={lineIdx} style={{ marginBottom: "6px", lineHeight: 1.65 }}>
        {renderInline(line)}
      </div>
    );
  });

  return elements;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    setError(null);
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Σφάλμα");
        return;
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e) {
      setError("Σφάλμα δικτύου");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "120px 24px 200px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "inline-block",
            marginBottom: "2rem",
          }}
        >
          ← Πίσω
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid var(--border)",
              background: "rgba(0, 229, 255, 0.05)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: "1.5rem",
            }}
          >
            ● AI Assistant
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Ρώτησε τον <span className="text-gradient">AI Βοηθό</span>
          </h1>

          {/* Header / Intro section στο Chat */}
          <div className="mb-6 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-semibold">
              🤖 Πειραματικός AI Βοηθός 1ΓΒ
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Ρώτησε για τα αποτελέσματα
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Ο βοηθός διαβάζει απευθείας από τους πίνακες του διαγωνισμού για να σου απαντήσει πού διορίστηκε κάποιος υποψήφιος, στατιστικά ειδικοτήτων κ.ά.
            </p>
            
            {/* Το έξυπνο notice για τα tokens */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 inline-block mt-2">
              💡 <em>Φιλική σημείωση:</em> Επειδή δεν έχουμε άπειρους πόρους και δωρεάν tokens, ισχύει όριο <strong>2 ερωτήσεις / 30 λεπτά</strong>. 
              Οπότε... <strong>«choose your words carefully»</strong> 😉 και ρωτήστε όσο πιο συγκεκριμένα μπορείτε (π.χ. με επώνυμο & όνομα ή κωδικό θέσης)!
            </div>
          </div>
        </motion.div>

        {/* Chat area */}
        <div
          className="glass"
          style={{
            padding: "1.5rem",
            minHeight: "400px",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {messages.length === 0 && (
            <div>
              <div
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                Δοκίμασε μία από τις παρακάτω:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "100px",
                      border: "1px solid var(--border)",
                      background: "rgba(0, 229, 255, 0.04)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.color = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            ref={scrollRef}
            style={{ maxHeight: "600px", overflowY: "auto" }}
          >
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ maxWidth: "85%" }}>
                    <div
                      style={{
                        padding: "14px 20px",
                        borderRadius:
                          m.role === "user"
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        background:
                          m.role === "user"
                            ? "rgba(0, 229, 255, 0.15)"
                            : "rgba(255, 255, 255, 0.04)",
                        border:
                          m.role === "user"
                            ? "1px solid rgba(0, 229, 255, 0.3)"
                            : "1px solid var(--border)",
                        fontSize: "0.95rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {m.role === "assistant"
                        ? renderMessage(m.content)
                        : m.content}
                    </div>

                    {/* Disclaimer κάτω από AI απαντήσεις */}
                    {m.role === "assistant" && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-dim)",
                          marginTop: "6px",
                          paddingLeft: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          lineHeight: 1.5,
                        }}
                      >
                        <span>⚠️</span>
                        <span>
                          AI απάντηση — επαλήθευσε με τα{" "}
                          <Link
                            href="/stats"
                            style={{
                              color: "var(--text-muted)",
                              textDecoration: "underline",
                              textDecorationColor: "rgba(122, 132, 153, 0.5)",
                              textUnderlineOffset: "2px",
                            }}
                          >
                            επίσημα στατιστικά
                          </Link>
                          .
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "12px 18px",
                  color: "var(--primary)",
                  fontSize: "0.85rem",
                }}
              >
                <span className="animate-pulse-slow">●</span>
                <span
                  className="animate-pulse-slow"
                  style={{ animationDelay: "0.2s" }}
                >
                  ●
                </span>
                <span
                  className="animate-pulse-slow"
                  style={{ animationDelay: "0.4s" }}
                >
                  ●
                </span>
              </motion.div>
            )}

            {error && (
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: "8px",
                  background: "rgba(255, 61, 113, 0.1)",
                  border: "1px solid rgba(255, 61, 113, 0.3)",
                  color: "var(--danger)",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div
          className="glass"
          style={{
            padding: "6px",
            display: "flex",
            gap: "6px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Πληκτρολόγησε την ερώτησή σου..."
            disabled={loading}
            maxLength={300}
            style={{
              flex: 1,
              padding: "14px 20px",
              fontSize: "1rem",
              background: "transparent",
              border: "none",
              color: "var(--text)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              padding: "14px 24px",
              borderRadius: "10px",
              border: "none",
              background:
                loading || !input.trim()
                  ? "rgba(255, 255, 255, 0.05)"
                  : "linear-gradient(135deg, var(--primary), var(--accent))",
              color: loading || !input.trim() ? "var(--text-dim)" : "#000",
              fontWeight: 700,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: "0.95rem",
            }}
          >
            {loading ? "..." : "Αποστολή"}
          </button>
        </div>

        {/* Bottom notices */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              background: "rgba(255, 184, 0, 0.05)",
              border: "1px solid rgba(255, 184, 0, 0.15)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            💡 Το AI είναι δωρεάν με όριο 2 ερωτήσεις / 30 λεπτά ανά χρήστη.
            Σύντομα: υποστήριξη παραπάνω ερωτήσεων.
          </div>

          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              textAlign: "center",
              lineHeight: 1.5,
              padding: "0 1rem",
            }}
          >
            ⚠️ Οι απαντήσεις του AI παράγονται αυτόματα και ενδέχεται να
            περιέχουν ανακρίβειες. Πάντα να επαληθεύετε με τα επίσημα
            αποτελέσματα του ΑΣΕΠ.
          </div>
        </div>
      </div>
    </main>
  );
}