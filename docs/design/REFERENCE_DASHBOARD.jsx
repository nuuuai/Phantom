import { useState, useEffect } from "react";

const D = {
  riskScore: 34, riskTrend: -12,
  activeAliases: 47, aliasesHealthy: 41, aliasesWarning: 4, aliasesCompromised: 2,
  brokersFound: 127, brokersRemoved: 89, brokersPending: 31, brokersRelisted: 7,
  callsScreened: 1284, scamsEngaged: 342, scammerMinutes: 4870, complaintsFile: 298,
  darkWebAlerts: 3,
  activity: [
    { type: "sword", label: "Scam engaged", desc: "IRS scam · Confused Retiree persona · 23 min", time: "2m" },
    { type: "shield", label: "Alias rotated", desc: "shopping_shade@phantom.id → new alias queued", time: "14m" },
    { type: "shield", label: "Broker removed", desc: "Spokeo confirmed removal of your profile", time: "1h" },
    { type: "brain", label: "Breach detected", desc: "Email alias found in LinkedIn data breach", time: "3h" },
    { type: "shield", label: "Call screened", desc: "Unknown caller identified as FedEx — forwarded", time: "4h" },
    { type: "autopilot", label: "Auto re-removal", desc: "WhitePages re-listed your data — removal re-submitted", time: "6h" },
  ],
  weeklyScams: [12, 18, 9, 24, 15, 21, 14],
  weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

function Counter({ value, duration = 1000 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s;
    const step = ts => { if (!s) s = ts; const p = Math.min((ts - s) / duration, 1); setV(Math.floor(p * value)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{v.toLocaleString()}</>;
}

const layerColors = {
  shield: { bg: "#0d2818", text: "#34D399", border: "#134e2a" },
  brain: { bg: "#1a1040", text: "#A78BFA", border: "#2d1b69" },
  sword: { bg: "#2a0f0f", text: "#F87171", border: "#5c1a1a" },
  autopilot: { bg: "#1a2332", text: "#60A5FA", border: "#1e3a5f" },
};

export default function PhantomDashboardC() {
  const [nav, setNav] = useState("overview");

  const sections = [
    { group: "CORE", items: [
      { id: "overview", label: "Overview" },
      { id: "aliases", label: "Aliases" },
      { id: "vault", label: "Vault" },
    ]},
    { group: "DEFENSE", items: [
      { id: "brokers", label: "Broker removal" },
      { id: "callguard", label: "Call Guard" },
      { id: "darkweb", label: "Dark web" },
    ]},
    { group: "OFFENSE", items: [
      { id: "engage", label: "Scam engage" },
      { id: "intel", label: "Threat intel" },
    ]},
    { group: "SYSTEM", items: [
      { id: "reports", label: "Reports" },
      { id: "family", label: "Family" },
      { id: "settings", label: "Settings" },
    ]},
  ];

  const maxScam = Math.max(...D.weeklyScams);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#101014", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#e8e8ec" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: 230, background: "#15151a", borderRight: "1px solid #222228",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #222228" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #6C3AED, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.9)", borderRadius: 3, transform: "rotate(45deg)" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>PHANTOM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              <div style={{ padding: "12px 24px 6px", fontSize: 10, fontWeight: 600, letterSpacing: 2, color: "#444450", fontFamily: "'IBM Plex Mono', monospace" }}>{section.group}</div>
              {section.items.map(item => (
                <div key={item.id} onClick={() => setNav(item.id)} style={{
                  padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: nav === item.id ? 600 : 400,
                  color: nav === item.id ? "#fff" : "#66666e",
                  background: nav === item.id ? "#1e1e28" : "transparent",
                  borderRight: nav === item.id ? "2px solid #6C3AED" : "2px solid transparent",
                  transition: "all 0.15s",
                }}>
                  {item.label}
                  {item.id === "darkweb" && D.darkWebAlerts > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 10, background: "#F8717120", color: "#F87171", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{D.darkWebAlerts}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #222228", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>L</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Leo Kay</div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#6C3AED", fontWeight: 600 }}>PRO</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        {/* Top Bar */}
        <div style={{
          padding: "16px 32px", borderBottom: "1px solid #222228",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#13131a",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Overview</span>
            <span style={{ fontSize: 12, color: "#55555e", fontFamily: "'IBM Plex Mono', monospace" }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ padding: "6px 14px", borderRadius: 6, background: "#1a1a24", border: "1px solid #2a2a34", fontSize: 12, color: "#888", cursor: "pointer" }}>
              This month ▾
            </div>
            <div style={{ padding: "6px 14px", borderRadius: 6, background: "#6C3AED15", border: "1px solid #6C3AED30", fontSize: 12, color: "#A78BFA", cursor: "pointer", fontWeight: 500 }}>
              + Generate alias
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {/* Risk + Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, background: "#222228", borderRadius: 12, overflow: "hidden", marginBottom: 20, animation: "fadeUp 0.5s ease both" }}>
            {/* Risk Score */}
            <div style={{ background: "#15151a", padding: "24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#55555e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Risk score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 300, color: "#34D399", letterSpacing: -2 }}><Counter value={D.riskScore} /></span>
                <span style={{ fontSize: 13, color: "#34D399", fontWeight: 500 }}>↓{Math.abs(D.riskTrend)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#44444e", marginTop: 4 }}>Low risk — strong posture</div>
            </div>

            <div style={{ background: "#15151a", padding: "24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#55555e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Active aliases</div>
              <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: -2 }}><Counter value={D.activeAliases} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12 }}>
                <span style={{ color: "#34D399" }}>{D.aliasesHealthy} healthy</span>
                <span style={{ color: "#FBBF24" }}>{D.aliasesWarning} warning</span>
                <span style={{ color: "#F87171" }}>{D.aliasesCompromised} critical</span>
              </div>
            </div>

            <div style={{ background: "#15151a", padding: "24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#55555e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Brokers</div>
              <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: -2 }}><Counter value={D.brokersRemoved} /><span style={{ fontSize: 18, color: "#55555e" }}>/{D.brokersFound}</span></div>
              <div style={{ height: 4, borderRadius: 2, background: "#222228", marginTop: 10 }}>
                <div style={{ height: "100%", borderRadius: 2, background: "#34D399", width: `${(D.brokersRemoved/D.brokersFound)*100}%`, transition: "width 1.5s ease" }} />
              </div>
            </div>

            <div style={{ background: "#15151a", padding: "24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#55555e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Scam engage</div>
              <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: -2, color: "#F87171" }}><Counter value={D.scammerMinutes} /><span style={{ fontSize: 14, color: "#55555e" }}> min</span></div>
              <div style={{ fontSize: 12, color: "#44444e", marginTop: 4 }}>{D.scamsEngaged} scammers · {D.complaintsFile} complaints</div>
            </div>
          </div>

          {/* Two Column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
            {/* Left: Activity */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#888" }}>Activity timeline</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {D.activity.map((a, i) => {
                  const lc = layerColors[a.type];
                  return (
                    <div key={i} style={{
                      display: "flex", gap: 14, padding: "14px 0",
                      borderBottom: i < D.activity.length - 1 ? "1px solid #1c1c24" : "none",
                      animation: `slideIn 0.4s ease ${i * 0.08}s both`,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", background: lc.text,
                        marginTop: 6, flexShrink: 0, boxShadow: `0 0 8px ${lc.text}40`,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5,
                            color: lc.text, background: lc.bg, border: `1px solid ${lc.border}`,
                            padding: "2px 8px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace",
                          }}>{a.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#d0d0d8" }}>{a.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#55555e", lineHeight: 1.4 }}>{a.desc}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#3a3a44", fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, marginTop: 2 }}>{a.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Weekly scams chart */}
              <div style={{
                background: "#15151a", border: "1px solid #222228", borderRadius: 12, padding: 20,
                animation: "fadeUp 0.5s ease 0.3s both",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#55555e", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace" }}>Scams this week</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                  {D.weeklyScams.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 10, color: "#55555e", fontFamily: "'IBM Plex Mono', monospace" }}>{v}</div>
                      <div style={{
                        width: "100%", borderRadius: 4,
                        height: `${(v / maxScam) * 60}px`,
                        background: i === D.weeklyScams.length - 1 ? "#6C3AED" : "#222230",
                        transition: "height 0.8s ease",
                      }} />
                      <div style={{ fontSize: 10, color: "#44444e" }}>{D.weekDays[i]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer status */}
              <div style={{
                background: "#15151a", border: "1px solid #222228", borderRadius: 12, padding: 20,
                animation: "fadeUp 0.5s ease 0.4s both",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#55555e", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace" }}>System layers</div>
                {[
                  { name: "Shield", status: "47 aliases active", layer: "shield" },
                  { name: "Brain", status: "Risk model updated 2h ago", layer: "brain" },
                  { name: "Sword", status: "342 scammers engaged", layer: "sword" },
                  { name: "Autopilot", status: "3 auto-actions today", layer: "autopilot" },
                ].map((l, i) => {
                  const lc = layerColors[l.layer];
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                      borderBottom: i < 3 ? "1px solid #1c1c24" : "none",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: 3, background: lc.text, boxShadow: `0 0 6px ${lc.text}50` }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#c0c0c8" }}>{l.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#55555e" }}>{l.status}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div style={{
                background: "#15151a", border: "1px solid #222228", borderRadius: 12, padding: 20,
                animation: "fadeUp 0.5s ease 0.5s both",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#55555e", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace" }}>Quick actions</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "New alias", color: "#6C3AED" },
                    { label: "Run scan", color: "#34D399" },
                    { label: "View threats", color: "#FBBF24" },
                    { label: "Exposure report", color: "#60A5FA" },
                  ].map((a, i) => (
                    <div key={i} style={{
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: `${a.color}08`, border: `1px solid ${a.color}20`,
                      fontSize: 12, fontWeight: 500, color: a.color,
                      textAlign: "center", transition: "background 0.2s",
                    }}>{a.label}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
