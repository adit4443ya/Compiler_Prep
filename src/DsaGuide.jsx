import { useState, useMemo, useEffect } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tk, Card, B, P, G, TabBanner } from "./App.jsx";
import { alpha, useSyntaxTheme } from "./theme.jsx";
import { PROBLEMS, CHEATSHEET, TIPS, CPP_CONCEPTS, NVIDIA_PROBLEMS, NVIDIA_BUG_HUNT, NVIDIA_OUTPUT_QUIZ, NVIDIA_TIPS } from "./dsaData";

// Merge NVIDIA_PROBLEMS into the full set
const ALL_PROBLEMS = [...PROBLEMS, ...NVIDIA_PROBLEMS];

// ── Difficulty colors ──────────────────────────────────────────────
const DC = { Easy: tk.green, Medium: tk.yellow, Hard: tk.red };

// ── Frequency colors (interview probability — orthogonal to difficulty) ──
const FC = { High: tk.rose, Medium: tk.amber, Low: tk.slate };

// ── Section accent colors ─────────────────────────────────────────
const SC = {
  "DP — Knapsack": tk.amber, "DP — String": tk.amberBright,
  "DP — Interval / Game": tk.mint, "DP — Bitmask": tk.sky,
  "DP — Sequence": tk.purple, "Graph — BFS": tk.pink,
  "Graph — Topo Sort": tk.orangeSoft, "Graph — Shortest Path": tk.emeraldBright,
  "Graph — Union Find": tk.blueSoft, "Graph — MST": tk.purpleLight,
  "Graph — Tarjan": tk.redSoft, "Sliding Window": tk.amberBright,
  "Monotonic Stack": tk.tealDim, "Prefix Sums": tk.indigo,
  "Greedy": tk.roseSoft, "Two Pointers": tk.lime,
  "Binary Search": tk.sky, "Heap": tk.fuchsia,
  "Trees": tk.greenBright, "Backtracking": tk.amber,
  "Linked List": tk.cyanBright, "Stack": tk.orange,
  "Trie": tk.violetPale, "System Design DSA": tk.teal,
};

// ── Small re-usable atoms ─────────────────────────────────────────
const Badge = ({ children, color = alpha(tk.accent,"33"), textColor = tk.accent, style = {} }) => (
  <span style={{
    padding: "3px 9px", borderRadius: 4, fontSize:"var(--fs-caption)", fontWeight: 800,
    background: color, color: textColor, textTransform: "uppercase",
    letterSpacing: 0.5, ...style
  }}>{children}</span>
);

const Label = ({ children, color = tk.accent }) => (
  <div style={{
    fontSize:"var(--fs-caption)", color, fontWeight: 800, letterSpacing: 1.8,
    textTransform: "uppercase", fontFamily: tk.mono, marginBottom: 8
  }}>{children}</div>
);

const CodeBlock = ({ code, label, color = tk.accent }) => {
  const syn = useSyntaxTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize:"var(--fs-caption)", color, fontWeight: 800, fontFamily: tk.mono }}>{label}</div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${tk.border}` }}>
        <SyntaxHighlighter
          language="cpp"
          style={syn}
          customStyle={{ margin: 0, padding: "20px", fontSize:"var(--fs-code)", background: tk.bg3, lineHeight: 1.65 }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// ── Segmented filter chips (used for difficulty × frequency) ──────
const FilterChips = ({ label, value, onChange, options, colorMap }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ fontSize:"var(--fs-caption)", fontWeight: 800, color: tk.textDim, fontFamily: tk.mono, letterSpacing: 1, width: 30, flexShrink: 0 }}>{label}</span>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map(opt => {
        const active = value === opt;
        const c = opt === "All" ? tk.accent : (colorMap[opt] || tk.accent);
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: "3px 9px", borderRadius: 5, fontSize:"var(--fs-caption)", fontWeight: 700,
              fontFamily: tk.mono, cursor: "pointer", transition: "all 0.12s",
              background: active ? alpha(c,"22") : "transparent",
              border: `1px solid ${active ? alpha(c,"88") : tk.border}`,
              color: active ? c : tk.textDim,
            }}
          >{opt}</button>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const DsaGuideComponent = ({ setMode, target }) => {
  const syn = useSyntaxTheme();   // syntax highlighting follows the app theme
  const [selectedProblem, setSelectedProblem] = useState(ALL_PROBLEMS[0]);
  const [expandedBug, setExpandedBug] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("problems");
  const [viewMode, setViewMode] = useState("sidebar");
  const [expandedCpp, setExpandedCpp] = useState(null);
  const [expandedQA, setExpandedQA] = useState({});
  const [diffFilter, setDiffFilter] = useState("All");   // Easy / Medium / Hard
  const [freqFilter, setFreqFilter] = useState("All");   // High / Medium / Low

  const categories = useMemo(() => {
    const cats = {};
    ALL_PROBLEMS.forEach(p => {
      if (!cats[p.section]) cats[p.section] = [];
      cats[p.section].push(p);
    });
    return cats;
  }, []);

  // Respond to a cross-tab jump (from global search): open a tab / problem.
  useEffect(() => {
    if (!target) return;
    if (target.tab) setActiveTab(target.tab);
    if (target.problemId != null) {
      const p = ALL_PROBLEMS.find(x => x.id === target.problemId);
      if (p) { setSelectedProblem(p); setViewMode("sidebar"); setSearch(""); }
    }
  }, [target]);

  const filteredProblems = useMemo(() => ALL_PROBLEMS.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.section.toLowerCase().includes(search.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(search.toLowerCase())) ||
      p.pattern.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = diffFilter === "All" || p.difficulty === diffFilter;
    const matchesFreq = freqFilter === "All" || (p.frequency || "Medium") === freqFilter;
    return matchesSearch && matchesDiff && matchesFreq;
  }), [search, diffFilter, freqFilter]);

  const TABS = [
    { key: "problems",  label: "Problems",      count: ALL_PROBLEMS.length },
    { key: "patterns",  label: "Patterns",       count: CHEATSHEET.length },
    { key: "cpp",       label: "C++ Deep Dive",  count: CPP_CONCEPTS.length },
    { key: "tips",      label: "Tips",           count: null },
    { key: "bughunt",   label: "🐛 Bug Hunt",     count: NVIDIA_BUG_HUNT.length },
    { key: "cppquiz",   label: "⚡ C++ Quiz",     count: NVIDIA_OUTPUT_QUIZ.length },
    { key: "nvidiatips",label: "🎯 NVIDIA Tips",  count: null },
  ];

  return (
    <div className="dsa-container" style={{
      display: "flex", flexDirection: "column", gap: "24px",
      color: tk.text, fontFamily: tk.sans, minHeight: "100vh",
      background: tk.bg, padding: "28px 36px 60px"
    }}>
      {/* Three-tab mental model: Learn → Revise → Practice (sibling-tab nav) */}
      <TabBanner mode="dsa" setMode={setMode} />

      {/* ── Header — same brief-box treatment as the Prep tab ── */}
      <div style={{ background: `linear-gradient(135deg,${tk.bg2},${tk.heroTint})`, border: `1px solid ${alpha(tk.accent,"44")}`, borderRadius: 14, padding: 28 }}>
        <div style={{ fontFamily: tk.mono, color: tk.accent, fontSize:"var(--fs-xs)", letterSpacing: ".1em", marginBottom: 8 }}>◆ PRACTICE · DSA</div>
        <h2 style={{ color: tk.textBright, fontFamily: tk.sans, margin: "0 0 8px", fontSize:"var(--fs-2xl)", fontWeight: 800 }}>Drill the patterns under interview pressure</h2>
        <p style={{ color: tk.textDim, margin: 0, fontSize:"var(--fs-base)", fontFamily: tk.sans }}>
          {ALL_PROBLEMS.length} problems · {CHEATSHEET.length} patterns · {CPP_CONCEPTS.length} C++ concepts · {NVIDIA_BUG_HUNT.length} bug-hunt exercises · {NVIDIA_OUTPUT_QUIZ.length} output quizzes
        </p>
      </div>

      {/* ── Tab bar — full-width, sibling-style ── */}
      <div className="dsa-tabs-scroll" style={{ display: "flex", background: tk.bg2, padding: 3, borderRadius: 8, border: `1px solid ${tk.border}`, gap: 2 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? tk.accent : "transparent",
              color: activeTab === t.key ? tk.bg : tk.textDim,
              border: "none", padding: "8px 16px", borderRadius: 6,
              fontSize:"var(--fs-xs)", fontWeight: 800, fontFamily: tk.mono,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.count && (
              <span style={{
                fontSize:"var(--fs-caption)", padding: "1px 5px", borderRadius: 8,
                background: activeTab === t.key ? "rgba(0,0,0,0.2)" : tk.border,
                color: activeTab === t.key ? tk.bg : tk.textDim,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ PROBLEMS TAB ══════════════ */}
      {activeTab === "problems" && (
        <div className="dsa-main-grid" style={{ display: "grid", gridTemplateColumns: viewMode === "sidebar" ? "300px 1fr" : "1fr", gap: "28px" }}>
          {/* Sidebar / controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  placeholder="Filter title, company, pattern..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: tk.bg2, border: `1px solid ${tk.border}`, color: tk.text,
                    padding: "9px 12px 9px 32px", borderRadius: 8, width: "100%",
                    fontSize:"var(--fs-sm)", outline: "none",
                  }}
                />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>⌕</span>
              </div>
              <button
                onClick={() => setViewMode(viewMode === "sidebar" ? "grid" : "sidebar")}
                style={{ background: tk.bg2, border: `1px solid ${tk.border}`, color: tk.textDim, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontSize:"var(--fs-lg)" }}
                title="Toggle view"
              >
                {viewMode === "sidebar" ? "⊞" : "▥"}
              </button>
            </div>

            {/* Independent filters: difficulty (hardness) × frequency (interview probability) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <FilterChips label="DIFF" value={diffFilter} onChange={setDiffFilter}
                options={["All", "Easy", "Medium", "Hard"]} colorMap={DC} />
              <FilterChips label="FREQ" value={freqFilter} onChange={setFreqFilter}
                options={["All", "High", "Medium", "Low"]} colorMap={FC} />
              {(diffFilter !== "All" || freqFilter !== "All") && (
                <div style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono, paddingLeft: 2 }}>
                  {filteredProblems.length} match
                  {(diffFilter !== "All" || freqFilter !== "All") && (
                    <button onClick={() => { setDiffFilter("All"); setFreqFilter("All"); }}
                      style={{ marginLeft: 8, background: "transparent", border: "none", color: tk.accent, cursor: "pointer", fontSize:"var(--fs-caption)", fontFamily: tk.mono, textDecoration: "underline" }}>
                      clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {viewMode === "sidebar" && (
              <div style={{ height: "calc(100vh - 300px)", overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(categories).map(([cat, probs]) => {
                  const inCat = probs.filter(p => filteredProblems.includes(p));
                  if (inCat.length === 0) return null;
                  return (
                    <details key={cat} open={search !== "" || cat === selectedProblem?.section}>
                      <summary style={{
                        cursor: "pointer", fontSize:"var(--fs-caption)", fontWeight: 800,
                        padding: "7px 12px", borderRadius: 6, background: tk.bg2,
                        marginBottom: 2, color: SC[cat] || tk.accent,
                        fontFamily: tk.mono, listStyle: "none",
                        display: "flex", justifyContent: "space-between",
                        border: `1px solid ${alpha(tk.border,"22")}`
                      }}>
                        {cat.toUpperCase()} <span style={{ opacity: 0.4 }}>{inCat.length}</span>
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 4, marginTop: 2, marginBottom: 8 }}>
                        {inCat.map(p => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProblem(p)}
                            style={{
                              padding: "7px 12px", cursor: "pointer", borderRadius: 4,
                              fontSize:"var(--fs-sm)",
                              background: selectedProblem?.id === p.id ? alpha(tk.accent,"22") : "transparent",
                              color: selectedProblem?.id === p.id ? tk.textBright : tk.textDim,
                              borderLeft: selectedProblem?.id === p.id ? `3px solid ${tk.accent}` : "3px solid transparent",
                              transition: "all 0.1s", display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}
                          >
                            <span>{p.title}</span>
                            <span style={{ fontSize:"var(--fs-caption)", color: DC[p.difficulty], fontWeight: 700 }}>{p.difficulty[0]}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div>
            {viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filteredProblems.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProblem(p); setViewMode("sidebar"); }}
                    style={{
                      background: tk.bg2, border: `1px solid ${tk.border}`, borderRadius: 12,
                      padding: 18, cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = SC[p.section] || tk.accent; e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.transform = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Badge color={alpha(DC[p.difficulty],"22")} textColor={DC[p.difficulty]}>{p.difficulty}</Badge>
                        <Badge color={alpha(FC[p.frequency || "Medium"],"22")} textColor={FC[p.frequency || "Medium"]}>{(p.frequency || "Medium")[0]}</Badge>
                      </div>
                      <span style={{ fontSize:"var(--fs-caption)", opacity: 0.35, fontFamily: tk.mono }}>LC #{p.leetcode}</span>
                    </div>
                    <div style={{ fontSize:"var(--fs-lg)", fontWeight: 700, marginBottom: 6, color: tk.textBright }}>{p.title}</div>
                    <div style={{ fontSize:"var(--fs-xs)", color: SC[p.section] || tk.accent, fontFamily: tk.mono, marginBottom: 10 }}>{p.pattern}</div>
                    <div style={{ fontSize:"var(--fs-sm)", color: tk.textDim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.intuition}</div>
                  </div>
                ))}
              </div>
            ) : (
              selectedProblem && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Card color={DC[selectedProblem.difficulty]}>
                    {/* Problem header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <Badge color={alpha(DC[selectedProblem.difficulty],"22")} textColor={DC[selectedProblem.difficulty]}>
                            {selectedProblem.difficulty}
                          </Badge>
                          <Badge color={alpha(FC[selectedProblem.frequency || "Medium"],"22")} textColor={FC[selectedProblem.frequency || "Medium"]}>
                            {selectedProblem.frequency || "Medium"} Freq
                          </Badge>
                          <span style={{ opacity: 0.35, fontSize:"var(--fs-xs)", fontFamily: tk.mono }}>LEETCODE #{selectedProblem.leetcode}</span>
                          <span style={{ opacity: 0.35, fontSize:"var(--fs-xs)", fontFamily: tk.mono }}>#{selectedProblem.id} of {PROBLEMS.length}</span>
                        </div>
                        <h2 style={{ fontSize:"var(--fs-3xl)", margin: 0, fontWeight: 800, color: tk.textBright }}>{selectedProblem.title}</h2>
                        <div style={{ marginTop: 6, fontSize:"var(--fs-sm)", color: tk.accent, fontWeight: 700, letterSpacing: 1, fontFamily: tk.mono }}>
                          ◆ {selectedProblem.pattern.toUpperCase()}
                        </div>
                      </div>
                      {selectedProblem.company && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>TARGET COMPANIES</div>
                          <div style={{ padding: "6px 12px", background: tk.bg3, borderRadius: 6, border: `1px solid ${tk.border}`, fontSize:"var(--fs-xs)", fontWeight: 700, color: tk.textBright }}>
                            {selectedProblem.company}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Intuition + Insight */}
                    <G cols={2} gap="24px">
                      <div>
                        <Label>Logic Intuition</Label>
                        <P style={{ fontSize:"var(--fs-base)", lineHeight: "1.7" }}>{selectedProblem.intuition}</P>
                      </div>
                      <div>
                        <Label color={tk.violet}>Architectural Insight</Label>
                        <div style={{ background: tk.bg3, padding: 16, borderRadius: 10, border: `1px solid ${alpha(tk.violet,"33")}`, borderLeft: `4px solid ${tk.violet}` }}>
                          <P style={{ fontSize:"var(--fs-md)", lineHeight: "1.65", color: tk.textBright, fontStyle: "italic", margin: 0 }}>
                            {selectedProblem.keyInsight || "Optimize for cache locality and minimal branch misprediction in time-critical paths."}
                          </P>
                        </div>
                      </div>
                    </G>

                    {/* Approach + Complexity */}
                    {selectedProblem.approach && (
                      <div style={{ marginTop: 18, padding: 14, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${alpha(tk.accent,"55")}` }}>
                        <Label>Approach</Label>
                        <P style={{ fontSize:"var(--fs-md)", lineHeight: "1.6", margin: 0 }}>{selectedProblem.approach}</P>
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize:"var(--fs-xs)", color: tk.textDim, fontFamily: tk.mono }}>⏱ {selectedProblem.complexity}</span>
                      {selectedProblem.memoCode && (
                        <Badge color={alpha(tk.violet,"22")} textColor={tk.violet}>Memoization vs Tabulation</Badge>
                      )}
                    </div>

                    {/* Code */}
                    <div style={{ marginTop: 20 }}>
                      <Label>C++ Implementation</Label>
                      <div style={{ display: "grid", gridTemplateColumns: selectedProblem.memoCode ? "1fr 1fr" : "1fr", gap: 16 }}>
                        {selectedProblem.memoCode && (
                          <CodeBlock code={selectedProblem.memoCode} label="// TOP-DOWN · MEMOIZATION" color={tk.violet} />
                        )}
                        <CodeBlock code={selectedProblem.tabCode} label={selectedProblem.memoCode ? "// BOTTOM-UP · TABULATION" : "// C++ SOLUTION"} color={tk.accent} />
                      </div>
                    </div>
                  </Card>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ══════════════ PATTERNS TAB ══════════════ */}
      {activeTab === "patterns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>Core Pattern Cheatsheet</h2>
            <P style={{ opacity: 0.5, fontSize:"var(--fs-md)", margin: 0 }}>15 universal problem-solving patterns with templates and recognition cues</P>
          </div>

          {/* Decision tree */}
          <div style={{ padding: 20, background: tk.bg2, borderRadius: 12, border: `1px solid ${alpha(tk.violet,"44")}` }}>
            <Label color={tk.violet}>Decision Tree</Label>
            <pre style={{ fontSize:"var(--fs-sm)", color: tk.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{`Shortest/min steps?
  ├─ Unweighted graph → BFS
  └─ Weighted (non-neg) → Dijkstra  |  Weighted (neg / K-stops) → Bellman-Ford
Count ways / optimize? → DP  (define states, recurrence, base cases)
Greedy? (prove local→global) → Greedy
Dependencies / order? → Topological Sort  (Kahn's BFS indegree)
Subset + constraint? → Knapsack  (reverse=0/1, forward=unbounded)
Two strings → 2D prefix DP  |  Pick from ends → Interval DP (fill by gap)
N ≤ 20 + subsets → Bitmask DP  |  Components → Union-Find / BFS/DFS
Subarray condition → Sliding Window / Prefix+HashMap  |  Sorted → Binary Search`}
            </pre>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
            {CHEATSHEET.map((item, idx) => (
              <div key={idx} style={{ padding: 20, background: tk.bg2, borderRadius: 12, border: `1px solid ${tk.border}` }}>
                <div style={{ fontSize:"var(--fs-base)", fontWeight: 800, color: tk.accent, marginBottom: 10, fontFamily: tk.mono }}>
                  {String(idx + 1).padStart(2, "0")}. {item.pattern}
                </div>
                <div style={{ fontSize:"var(--fs-sm)", color: tk.textDim, marginBottom: 8 }}>
                  <span style={{ color: tk.amberBright, fontWeight: 700 }}>WHEN: </span>{item.when}
                </div>
                <div style={{ fontFamily: tk.mono, fontSize:"var(--fs-xs)", padding: "8px 12px", background: tk.bg3, borderRadius: 6, color: tk.accent, marginBottom: 8 }}>
                  {item.template}
                </div>
                <div style={{ fontSize:"var(--fs-xs)", color: tk.violet }}>💡 {item.tip}</div>
                {item.problems && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {item.problems.map((pb, i) => (
                      <span key={i} style={{ fontSize:"var(--fs-caption)", padding: "2px 7px", borderRadius: 10, background: tk.bg3, color: tk.textDim, border: `1px solid ${tk.border}` }}>{pb}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ C++ DEEP DIVE TAB ══════════════ */}
      {activeTab === "cpp" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>C++ Deep Dive</h2>
            <P style={{ opacity: 0.5, fontSize:"var(--fs-md)", margin: 0 }}>Compiler-level concepts asked at Apple, Nvidia, Qualcomm, AMD — lvalue/rvalue, move semantics, vtable, UB, atomics</P>
          </div>

          {CPP_CONCEPTS.map(concept => (
            <div key={concept.id} style={{ background: tk.bg2, borderRadius: 12, border: `1px solid ${expandedCpp === concept.id ? alpha(tk.accent,"66") : tk.border}`, overflow: "hidden" }}>
              {/* Concept Header — clickable */}
              <button
                onClick={() => setExpandedCpp(expandedCpp === concept.id ? null : concept.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "16px 20px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left", color: tk.text,
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 6, background: alpha(tk.accent,"22"), color: tk.accent, fontSize:"var(--fs-sm)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {String(concept.id).padStart(2, "0")}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize:"var(--fs-lg)", color: tk.textBright }}>{concept.title}</div>
                  <div style={{ fontSize:"var(--fs-xs)", color: tk.textDim, marginTop: 2 }}>{concept.category}</div>
                </div>
                <Badge color={alpha(tk.accent,"22")} textColor={tk.accent}>{concept.qa.length} Q&As</Badge>
                <span style={{ color: tk.textDim, fontSize:"var(--fs-base)", transform: expandedCpp === concept.id ? "rotate(90deg)" : "none", transition: "0.2s" }}>▶</span>
              </button>

              {expandedCpp === concept.id && (
                <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${tk.border}` }}>
                  {/* Explanation */}
                  <div style={{ marginTop: 16, padding: 16, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${tk.accent}` }}>
                    <Label>Concept Overview</Label>
                    <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.7, margin: 0 }}>{concept.explanation}</P>
                  </div>

                  {/* Key Insight */}
                  <div style={{ marginTop: 12, padding: 14, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${tk.violet}` }}>
                    <Label color={tk.violet}>Key Insight</Label>
                    <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0, fontStyle: "italic", color: tk.textBright }}>{concept.keyInsight}</P>
                  </div>

                  {/* Code Example */}
                  <div style={{ marginTop: 16 }}>
                    <Label color={tk.teal}>Reference Code</Label>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${tk.border}` }}>
                      <SyntaxHighlighter language="cpp" style={syn}
                        customStyle={{ margin: 0, padding: "20px", fontSize:"var(--fs-code)", background: tk.bg3, lineHeight: 1.65 }}>
                        {concept.codeExample}
                      </SyntaxHighlighter>
                    </div>
                  </div>

                  {/* Q&A Cards */}
                  <div style={{ marginTop: 20 }}>
                    <Label color={tk.amber}>Interview Q&A</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {concept.qa.map((qa, qIdx) => {
                        const qaKey = `${concept.id}-${qIdx}`;
                        const open = expandedQA[qaKey];
                        return (
                          <div key={qIdx} style={{ background: tk.bg, borderRadius: 8, border: `1px solid ${open ? alpha(tk.amber,"55") : tk.border}`, overflow: "hidden" }}>
                            {/* Question header */}
                            <button
                              onClick={() => setExpandedQA(prev => ({ ...prev, [qaKey]: !prev[qaKey] }))}
                              style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }}
                            >
                              <span style={{ fontSize:"var(--fs-caption)", fontWeight: 800, padding: "3px 7px", borderRadius: 4, background: qa.willCompile ? alpha(tk.green,"22") : alpha(tk.red,"22"), color: qa.willCompile ? tk.green : tk.red, flexShrink: 0, marginTop: 1 }}>
                                {qa.willCompile ? "COMPILES" : "ERROR"}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${tk.border}` }}>
                                  <SyntaxHighlighter language="cpp" style={syn}
                                    customStyle={{ margin: 0, padding: "12px 14px", fontSize:"var(--fs-code)", background: tk.bg3, lineHeight: 1.6 }}>
                                    {qa.question}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                              <span style={{ color: tk.textDim, fontSize:"var(--fs-sm)", transform: open ? "rotate(90deg)" : "none", transition: "0.2s", flexShrink: 0 }}>▶</span>
                            </button>

                            {open && (
                              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${tk.border}` }}>
                                {/* Answer */}
                                <div style={{ marginTop: 12, padding: 14, background: tk.bg2, borderRadius: 8, borderLeft: `4px solid ${qa.willCompile ? tk.green : tk.red}` }}>
                                  <Label color={qa.willCompile ? tk.green : tk.red}>Answer</Label>
                                  <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0 }}>{qa.answer}</P>
                                </div>

                                {/* Fixed Code */}
                                {qa.fixedCode && (
                                  <div style={{ marginTop: 12 }}>
                                    <Label color={tk.green}>Fix / Correct Code</Label>
                                    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${alpha(tk.green,"33")}` }}>
                                      <SyntaxHighlighter language="cpp" style={syn}
                                        customStyle={{ margin: 0, padding: "14px 16px", fontSize:"var(--fs-code)", background: tk.bg3, lineHeight: 1.65 }}>
                                        {qa.fixedCode}
                                      </SyntaxHighlighter>
                                    </div>
                                  </div>
                                )}

                                {/* Explanation */}
                                <div style={{ marginTop: 12, padding: 12, background: tk.bg2, borderRadius: 8, borderLeft: `4px solid ${tk.violet}` }}>
                                  <Label color={tk.violet}>Deep Explanation</Label>
                                  <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0, color: tk.textDim }}>{qa.explanation}</P>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ TIPS TAB ══════════════ */}
      {activeTab === "tips" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>Interview Tips & Insights</h2>
            <P style={{ opacity: 0.5, fontSize:"var(--fs-md)", margin: 0 }}>Pattern recognition, complexity guides, STL reference, common mistakes, and communication strategy</P>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 20 }}>
            {TIPS.map((section, idx) => {
              const accent = [tk.accent, tk.violet, tk.teal, tk.amber, tk.pink, tk.greenBright][idx % 6];
              return (
                <div key={idx} style={{ background: tk.bg2, borderRadius: 12, padding: 20, border: `1px solid ${tk.border}`, borderTop: `3px solid ${accent}` }}>
                  <h3 style={{ fontSize:"var(--fs-base)", fontWeight: 800, color: accent, margin: "0 0 14px", letterSpacing: 0.5 }}>{section.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {section.tips.map((tip, tidx) => (
                      <div key={tidx} style={{ display: "flex", gap: 10, fontSize:"var(--fs-md)", lineHeight: 1.6, color: tk.textDim }}>
                        <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>▹</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ 🐛 BUG HUNT TAB ══════════════ */}
      {activeTab === "bughunt" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>
              🐛 Bug Hunt — <span style={{ color: tk.red }}>NVIDIA Code Reading Exercises</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize:"var(--fs-md)", margin: 0 }}>
              Based on real NVIDIA compiler verification interview format. Read code → identify bugs → explain → fix. Talk out loud!
            </P>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {NVIDIA_BUG_HUNT.map((exercise) => (
              <div key={exercise.id} style={{
                background: tk.bg2, borderRadius: 14, border: `1px solid ${tk.border}`,
                borderLeft: `4px solid ${tk.red}`, overflow: "hidden"
              }}>
                {/* Header */}
                <div
                  style={{ padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setExpandedBug(expandedBug === exercise.id ? null : exercise.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: tk.red, fontFamily: tk.mono, fontWeight: 900, fontSize:"var(--fs-md)" }}>#{exercise.id.toString().padStart(2,"0")}</span>
                    <div>
                      <div style={{ color: tk.textBright, fontWeight: 800, fontSize:"var(--fs-lg)" }}>{exercise.title}</div>
                      <div style={{ color: tk.textDim, fontSize:"var(--fs-xs)", marginTop: 2 }}>{exercise.category}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize:"var(--fs-caption)", padding: "3px 9px", borderRadius: 4, fontWeight: 800,
                      background: exercise.difficulty === "High Probability" ? alpha(tk.red,"33") : alpha(tk.amber,"33"),
                      color: exercise.difficulty === "High Probability" ? tk.red : tk.amber,
                    }}>{exercise.difficulty}</span>
                    <span style={{ color: tk.textDim, fontSize:"var(--fs-xl)", lineHeight: 1 }}>{expandedBug === exercise.id ? "−" : "+"}</span>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedBug === exercise.id && (
                  <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Buggy Code */}
                    <div>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.red, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ BUGGY CODE — FIND THE BUGS</div>
                      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${alpha(tk.red,"44")}` }}>
                        <SyntaxHighlighter language="cpp" style={syn}
                          customStyle={{ margin: 0, padding: "18px", fontSize:"var(--fs-code)", background: alpha(tk.red,"14"), lineHeight: 1.65 }}>
                          {exercise.buggyCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* Bug List */}
                    <div style={{ background: alpha(tk.red,"12"), borderRadius: 8, padding: "14px 18px", border: `1px solid ${alpha(tk.red,"22")}` }}>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.red, fontWeight: 800, fontFamily: tk.mono, marginBottom: 8, letterSpacing: 1 }}>▸ BUGS FOUND</div>
                      {exercise.bugs.map((bug, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, fontSize:"var(--fs-md)", lineHeight: 1.6, color: tk.redPale, marginBottom: 4 }}>
                          <span style={{ color: tk.red, flexShrink: 0 }}>⚠</span>
                          <span>{bug}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fixed Code */}
                    <div>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.green, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ FIXED CODE</div>
                      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${alpha(tk.green,"44")}` }}>
                        <SyntaxHighlighter language="cpp" style={syn}
                          customStyle={{ margin: 0, padding: "18px", fontSize:"var(--fs-code)", background: alpha(tk.green,"10"), lineHeight: 1.65 }}>
                          {exercise.fixedCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* What to say */}
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "14px 18px", borderLeft: `3px solid ${tk.accent}` }}>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.accent, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ WHAT TO SAY OUT LOUD</div>
                      <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0, color: tk.textDim }}>{exercise.whatToSay}</P>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ ⚡ C++ OUTPUT QUIZ TAB ══════════════ */}
      {activeTab === "cppquiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>
              ⚡ C++ Output Quiz — <span style={{ color: tk.accent }}>Tricky Snippets</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize:"var(--fs-md)", margin: 0 }}>
              Real patterns from NVIDIA LLVM compiler rounds. Read snippet → predict output → check your answer.
            </P>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20 }}>
            {NVIDIA_OUTPUT_QUIZ.map((quiz) => (
              <div key={quiz.id} style={{
                background: tk.bg2, borderRadius: 14, border: `1px solid ${tk.border}`,
                borderTop: `3px solid ${tk.accent}`, overflow: "hidden"
              }}>
                {/* Header */}
                <div
                  style={{ padding: "16px 20px", cursor: "pointer" }}
                  onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize:"var(--fs-caption)", color: tk.accent, fontFamily: tk.mono, fontWeight: 800 }}>Q{quiz.id.toString().padStart(2,"0")} · {quiz.category}</span>
                      <div style={{ color: tk.textBright, fontWeight: 800, fontSize:"var(--fs-base)", marginTop: 3 }}>{quiz.title}</div>
                    </div>
                    <span style={{ color: tk.textDim, fontSize:"var(--fs-xl)" }}>{expandedQuiz === quiz.id ? "−" : "+"}</span>
                  </div>

                  {/* Always show code snippet */}
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${tk.border}`, marginTop: 12 }}>
                    <SyntaxHighlighter language="cpp" style={syn}
                      customStyle={{ margin: 0, padding: "14px", fontSize:"var(--fs-code)", background: tk.bg3, lineHeight: 1.6 }}>
                      {quiz.code}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Answer */}
                {expandedQuiz === quiz.id && (
                  <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: alpha(tk.green,"12"), borderRadius: 8, padding: "12px 16px", border: `1px solid ${alpha(tk.green,"44")}` }}>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.green, fontWeight: 800, fontFamily: tk.mono, marginBottom: 4 }}>▸ CORRECT OUTPUT</div>
                      <P style={{ fontSize:"var(--fs-base)", fontWeight: 700, color: tk.greenPale, margin: 0, fontFamily: tk.mono }}>{quiz.correctAnswer}</P>
                    </div>
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${tk.violet}` }}>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.violet, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6 }}>▸ EXPLANATION</div>
                      <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0, color: tk.textDim }}>{quiz.explanation}</P>
                    </div>
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${tk.accent}` }}>
                      <div style={{ fontSize:"var(--fs-caption)", color: tk.accent, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6 }}>▸ KEY INSIGHT</div>
                      <P style={{ fontSize:"var(--fs-md)", lineHeight: 1.65, margin: 0, color: tk.textDim }}>{quiz.keyInsight}</P>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ 🎯 NVIDIA TIPS TAB ══════════════ */}
      {activeTab === "nvidiatips" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ color: tk.textBright, fontSize:"var(--fs-xl)", margin: "0 0 4px", fontWeight: 800 }}>
              🎯 NVIDIA Compiler Verification — <span style={{ color: tk.red }}>Interview Strategy</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize:"var(--fs-md)", margin: 0 }}>
              Role-specific preparation for the NVIDIA Compiler Verification Associate Engineer round. Real format, real bugs, real strategy.
            </P>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 20 }}>
            {NVIDIA_TIPS.map((section, idx) => {
              const accent = [tk.red, tk.amber, tk.green, tk.sky, tk.purple, tk.mint][idx % 6];
              return (
                <div key={idx} style={{
                  background: tk.bg2, borderRadius: 12, padding: 20,
                  border: `1px solid ${tk.border}`, borderTop: `3px solid ${accent}`
                }}>
                  <h3 style={{ fontSize:"var(--fs-base)", fontWeight: 800, color: accent, margin: "0 0 14px" }}>{section.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {section.tips.map((tip, tidx) => (
                      <div key={tidx} style={{ display: "flex", gap: 10, fontSize:"var(--fs-sm)", lineHeight: 1.65, color: tk.textDim }}>
                        <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>▹</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default DsaGuideComponent;
