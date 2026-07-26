"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useVoice } from "@/hooks/useVoice";

export default function CommandConsole() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Command AI online. Ask about hotspots, patrol allocation, gang networks, or a case number." },
  ]);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [voiceReply, setVoiceReply] = useState(false);

  const voice = useVoice();

  useEffect(() => {
    api.networkStats().then(setModelInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!voice.listening && voice.transcript) {
      setQuery(voice.transcript);
    }
  }, [voice.listening, voice.transcript]);

  async function send(overrideText?: string) {
    const text = (overrideText ?? query).trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setQuery("");
    setLoading(true);
    try {
      const r = await api.chat(text);
      setMessages((m) => [...m, { role: "ai", text: r.answer }]);
      if (voiceReply) voice.speak(r.answer);
    } catch {
      const errText = "Unable to reach the analytics backend right now.";
      setMessages((m) => [...m, { role: "ai", text: errText }]);
      if (voiceReply) voice.speak(errText);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (voice.listening) {
      voice.stopListening();
      if (voice.transcript.trim()) send(voice.transcript);
    } else {
      voice.startListening();
    }
  }

  return (
    <div className="bg-panel relative overflow-hidden border border-line/60 flex flex-col h-full group hover:border-blue/50 transition-colors">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
      
      <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-line/50 bg-black/40">
        <div>
          <div className="display-font text-sm tracking-widest text-white italic">COMMAND AI</div>
          <div className="text-[9px] text-muted tracking-widest font-mono">INVESTIGATION COPILOT</div>
        </div>
        <div className="flex items-center gap-3">
          {voice.supported && (
            <button
              onClick={() => setVoiceReply((v) => !v)}
              title="Read AI replies aloud"
              aria-pressed={voiceReply}
              aria-label="Toggle voice replies"
              className={`text-[9px] px-2 py-0.5 rounded-none border font-mono tracking-widest transition-colors ${
                voiceReply ? "border-blue/50 text-blue bg-blue/10" : "border-line/50 text-muted hover:text-white"
              }`}
            >
              {voiceReply ? "VOICE: ON" : "VOICE: OFF"}
            </button>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-none border border-emerald-400/40 text-emerald-400 font-mono tracking-widest bg-emerald-400/10">
            ONLINE
          </span>
        </div>
      </div>

      <div className="relative z-20 grid grid-cols-3 gap-2 px-4 py-3 border-b border-line/50 bg-black/40 text-center">
        <div>
          <div className="text-[9px] font-mono text-muted tracking-widest mb-1">NODES</div>
          <div className="data-mono text-sm text-white">{modelInfo?.node_count ?? "--"}</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-muted tracking-widest mb-1">EDGES</div>
          <div className="data-mono text-sm text-white">{modelInfo?.edge_count ?? "--"}</div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-muted tracking-widest mb-1">AI MODULE</div>
          <div className="data-mono text-sm text-accent">ACTIVE</div>
        </div>
      </div>

      <div className="relative z-20 flex-1 overflow-y-auto px-4 py-4 space-y-4 scanline bg-black/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`inline-block max-w-[85%] px-4 py-3 text-[11px] font-mono leading-relaxed border ${
                m.role === "user" ? "bg-blue/10 text-white border-blue/40 shadow-[inset_2px_0_0_#2b70b4]" : "bg-panel2/80 text-blue/90 border-line/60 shadow-[inset_-2px_0_0_#e57231]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-[10px] font-mono text-muted tracking-widest animate-pulse">ANALYZING GRAPH AND RISK MODELS...</div>}
        {voice.listening && (
          <div className="text-[10px] font-mono text-blue flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue pulse-dot" /> LISTENING... {voice.transcript.toUpperCase()}
          </div>
        )}
      </div>

      <div className="relative z-20 p-3 border-t border-line/50 bg-black/40 flex gap-2">
        {voice.supported && (
          <button
            onClick={toggleMic}
            title={voice.listening ? "Stop listening" : "Ask by voice"}
            aria-label={voice.listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={voice.listening}
            className={`shrink-0 w-10 h-10 border flex items-center justify-center transition-colors ${
              voice.listening ? "border-accent bg-accent/15 text-accent shadow-glow" : "border-line/60 bg-panel2 text-muted hover:text-white"
            }`}
          >
            <MicIcon active={voice.listening} />
          </button>
        )}
        <input
          aria-label="Ask Command AI"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={voice.supported ? "ENTER COMMAND OR TAP MIC..." : "ENTER COMMAND..."}
          className="flex-1 bg-panel2 border border-line/60 px-4 py-2 text-[11px] font-mono text-white placeholder:text-muted focus:outline-none focus:border-blue/60 transition-colors uppercase"
        />
        <button
          onClick={() => send()}
          className="px-4 py-2 bg-transparent border-2 border-accent text-accent text-[11px] font-mono font-bold tracking-widest hover:bg-accent hover:text-black transition-colors"
        >
          EXECUTE
        </button>
      </div>
      {!voice.supported && (
        <div className="relative z-20 px-4 pb-3 pt-1 bg-black/40 text-[9px] font-mono text-muted tracking-widest">
          VOICE INPUT/OUTPUT UNAVAILABLE.
        </div>
      )}
    </div>
  );
}

function MicIcon({ active }: { active: boolean }) {
  const c = active ? "#e57231" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={c} strokeWidth="1.7" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
