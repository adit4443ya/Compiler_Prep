import { useState, useMemo } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { tk, Card, B, P, G } from "./App.jsx";
import { PROBLEMS, CHEATSHEET, TIPS, CPP_CONCEPTS, NVIDIA_PROBLEMS, NVIDIA_BUG_HUNT, NVIDIA_OUTPUT_QUIZ, NVIDIA_TIPS } from "./dsaData";

// Merge NVIDIA_PROBLEMS into the full set
const ALL_PROBLEMS = [...PROBLEMS, ...NVIDIA_PROBLEMS];

// ── Difficulty colors ──────────────────────────────────────────────
const DC = { Easy: "#22c55e", Medium: "#eab308", Hard: "#ef4444" };

// ── Section accent colors ─────────────────────────────────────────
const SC = {
  "DP — Knapsack": "#f59e0b", "DP — String": "#fbbf24",
  "DP — Interval / Game": "#06d6a0", "DP — Bitmask": "#38bdf8",
  "DP — Sequence": "#a855f7", "Graph — BFS": "#f472b6",
  "Graph — Topo Sort": "#fb923c", "Graph — Shortest Path": "#34d399",
  "Graph — Union Find": "#60a5fa", "Graph — MST": "#c084fc",
  "Graph — Tarjan": "#f87171", "Sliding Window": "#fbbf24",
  "Monotonic Stack": "#2dd4bf", "Prefix Sums": "#818cf8",
  "Greedy": "#fb7185", "Two Pointers": "#a3e635",
  "Binary Search": "#38bdf8", "Heap": "#e879f9",
  "Trees": "#4ade80", "Backtracking": "#f59e0b",
  "Linked List": "#67e8f9", "Stack": "#f97316",
  "Trie": "#c4b5fd", "System Design DSA": "#22d3ee",
};

// ── Small re-usable atoms ─────────────────────────────────────────
const Badge = ({ children, color = tk.accent + "33", textColor = tk.accent, style = {} }) => (
  <span style={{
    padding: "3px 9px", borderRadius: 4, fontSize: 10, fontWeight: 800,
    background: color, color: textColor, textTransform: "uppercase",
    letterSpacing: 0.5, ...style
  }}>{children}</span>
);

const Label = ({ children, color = tk.accent }) => (
  <div style={{
    fontSize: 10, color, fontWeight: 800, letterSpacing: 1.8,
    textTransform: "uppercase", fontFamily: tk.mono, marginBottom: 8
  }}>{children}</div>
);

const CodeBlock = ({ code, label, color = tk.accent }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ fontSize: 10, color, fontWeight: 800, fontFamily: tk.mono }}>{label}</div>
    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${tk.border}` }}>
      <SyntaxHighlighter
        language="cpp"
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: "20px", fontSize: "0.82rem", background: tk.bg3, lineHeight: 1.65 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const DsaGuideComponent = ({ setMode }) => {
  const [selectedProblem, setSelectedProblem] = useState(ALL_PROBLEMS[0]);
  const [expandedBug, setExpandedBug] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("problems");
  const [viewMode, setViewMode] = useState("sidebar");
  const [expandedCpp, setExpandedCpp] = useState(null);
  const [expandedQA, setExpandedQA] = useState({});

  const categories = useMemo(() => {
    const cats = {};
    ALL_PROBLEMS.forEach(p => {
      if (!cats[p.section]) cats[p.section] = [];
      cats[p.section].push(p);
    });
    return cats;
  }, []);

  const filteredProblems = useMemo(() => ALL_PROBLEMS.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.section.toLowerCase().includes(search.toLowerCase()) ||
    (p.company && p.company.toLowerCase().includes(search.toLowerCase())) ||
    p.pattern.toLowerCase().includes(search.toLowerCase())
  ), [search]);

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
      background: tk.bg, padding: "24px 32px"
    }}>
      {/* ── Header ── */}
      <div className="dsa-header-flex" style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        borderBottom: `1px solid ${tk.border}`, paddingBottom: "20px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: "2.6rem", fontWeight: 900, margin: 0, color: tk.textBright, letterSpacing: "-0.02em" }}>
              DSA <span style={{ color: tk.accent }}>FORGE</span>
            </h1>
            <Badge color={tk.accent + "33"} textColor={tk.accent}>Elite Edition</Badge>
          </div>
          <P style={{ opacity: 0.55, fontSize: 14, margin: 0 }}>
            {ALL_PROBLEMS.length} Problems · {CHEATSHEET.length} Patterns · 10 C++ Concepts · {NVIDIA_BUG_HUNT.length} Bug Exercises · {NVIDIA_OUTPUT_QUIZ.length} Quiz | <span style={{color:'#ef4444',fontWeight:900}}>NVIDIA Round 1 Ready</span>
          </P>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
          <button
            onClick={() => setMode("compiler")}
            style={{
              background: "transparent", border: `1px solid ${tk.border}`, color: tk.textDim,
              padding: "6px 14px", borderRadius: 6, fontSize: 11, fontFamily: tk.mono,
              cursor: "pointer",
            }}
            onMouseOver={e => { e.currentTarget.style.color = tk.text; e.currentTarget.style.borderColor = tk.textDim; }}
            onMouseOut={e => { e.currentTarget.style.color = tk.textDim; e.currentTarget.style.borderColor = tk.border; }}
          >
            ← EXIT TO COMPILER FORGE
          </button>

          {/* Tab Bar */}
          <div className="dsa-tabs-scroll" style={{ display: "flex", background: tk.bg2, padding: 3, borderRadius: 8, border: `1px solid ${tk.border}`, gap: 2 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  background: activeTab === t.key ? tk.accent : "transparent",
                  color: activeTab === t.key ? tk.bg : tk.textDim,
                  border: "none", padding: "6px 14px", borderRadius: 6,
                  fontSize: 11, fontWeight: 800, fontFamily: tk.mono,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {t.label}
                {t.count && (
                  <span style={{
                    fontSize: 9, padding: "1px 5px", borderRadius: 8,
                    background: activeTab === t.key ? "rgba(0,0,0,0.2)" : tk.border,
                    color: activeTab === t.key ? tk.bg : tk.textDim,
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
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
                    fontSize: 12, outline: "none",
                  }}
                />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>⌕</span>
              </div>
              <button
                onClick={() => setViewMode(viewMode === "sidebar" ? "grid" : "sidebar")}
                style={{ background: tk.bg2, border: `1px solid ${tk.border}`, color: tk.textDim, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontSize: 16 }}
                title="Toggle view"
              >
                {viewMode === "sidebar" ? "⊞" : "▥"}
              </button>
            </div>

            {viewMode === "sidebar" && (
              <div style={{ height: "calc(100vh - 300px)", overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(categories).map(([cat, probs]) => {
                  const inCat = probs.filter(p => filteredProblems.includes(p));
                  if (inCat.length === 0) return null;
                  return (
                    <details key={cat} open={search !== "" || cat === selectedProblem?.section}>
                      <summary style={{
                        cursor: "pointer", fontSize: 10, fontWeight: 800,
                        padding: "7px 12px", borderRadius: 6, background: tk.bg2,
                        marginBottom: 2, color: SC[cat] || tk.accent,
                        fontFamily: tk.mono, listStyle: "none",
                        display: "flex", justifyContent: "space-between",
                        border: `1px solid ${tk.border}22`
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
                              fontSize: 12,
                              background: selectedProblem?.id === p.id ? tk.accent + "22" : "transparent",
                              color: selectedProblem?.id === p.id ? tk.textBright : tk.textDim,
                              borderLeft: selectedProblem?.id === p.id ? `3px solid ${tk.accent}` : "3px solid transparent",
                              transition: "all 0.1s", display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}
                          >
                            <span>{p.title}</span>
                            <span style={{ fontSize: 9, color: DC[p.difficulty], fontWeight: 700 }}>{p.difficulty[0]}</span>
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <Badge color={DC[p.difficulty] + "22"} textColor={DC[p.difficulty]}>{p.difficulty}</Badge>
                      <span style={{ fontSize: 10, opacity: 0.35, fontFamily: tk.mono }}>LC #{p.leetcode}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: tk.textBright }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: SC[p.section] || tk.accent, fontFamily: tk.mono, marginBottom: 10 }}>{p.pattern}</div>
                    <div style={{ fontSize: 12, color: tk.textDim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.intuition}</div>
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
                          <Badge color={DC[selectedProblem.difficulty] + "22"} textColor={DC[selectedProblem.difficulty]}>
                            {selectedProblem.difficulty}
                          </Badge>
                          <span style={{ opacity: 0.35, fontSize: 11, fontFamily: tk.mono }}>LEETCODE #{selectedProblem.leetcode}</span>
                          <span style={{ opacity: 0.35, fontSize: 11, fontFamily: tk.mono }}>#{selectedProblem.id} of {PROBLEMS.length}</span>
                        </div>
                        <h2 style={{ fontSize: "2rem", margin: 0, fontWeight: 800, color: tk.textBright }}>{selectedProblem.title}</h2>
                        <div style={{ marginTop: 6, fontSize: 12, color: tk.accent, fontWeight: 700, letterSpacing: 1, fontFamily: tk.mono }}>
                          ◆ {selectedProblem.pattern.toUpperCase()}
                        </div>
                      </div>
                      {selectedProblem.company && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: tk.textDim, fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>TARGET COMPANIES</div>
                          <div style={{ padding: "6px 12px", background: tk.bg3, borderRadius: 6, border: `1px solid ${tk.border}`, fontSize: 11, fontWeight: 700, color: tk.textBright }}>
                            {selectedProblem.company}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Intuition + Insight */}
                    <G cols={2} gap="24px">
                      <div>
                        <Label>Logic Intuition</Label>
                        <P style={{ fontSize: "0.95rem", lineHeight: "1.7" }}>{selectedProblem.intuition}</P>
                      </div>
                      <div>
                        <Label color={tk.violet}>Architectural Insight</Label>
                        <div style={{ background: tk.bg3, padding: 16, borderRadius: 10, border: `1px solid ${tk.violet}33`, borderLeft: `4px solid ${tk.violet}` }}>
                          <P style={{ fontSize: "0.9rem", lineHeight: "1.65", color: tk.textBright, fontStyle: "italic", margin: 0 }}>
                            {selectedProblem.keyInsight || "Optimize for cache locality and minimal branch misprediction in time-critical paths."}
                          </P>
                        </div>
                      </div>
                    </G>

                    {/* Approach + Complexity */}
                    {selectedProblem.approach && (
                      <div style={{ marginTop: 18, padding: 14, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${tk.accent}55` }}>
                        <Label>Approach</Label>
                        <P style={{ fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>{selectedProblem.approach}</P>
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 11, color: tk.textDim, fontFamily: tk.mono }}>⏱ {selectedProblem.complexity}</span>
                      {selectedProblem.memoCode && (
                        <Badge color={tk.violet + "22"} textColor={tk.violet}>Memoization vs Tabulation</Badge>
                      )}
                    </div>

                    {/* Code */}
                    <div style={{ marginTop: 20 }}>
                      <Label>Elite C++ Implementation</Label>
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
            <h2 style={{ color: tk.textBright, fontSize: 18, margin: "0 0 4px", fontWeight: 800 }}>Core Pattern Cheatsheet</h2>
            <P style={{ opacity: 0.5, fontSize: 13, margin: 0 }}>15 universal problem-solving patterns with templates and recognition cues</P>
          </div>

          {/* Decision tree */}
          <div style={{ padding: 20, background: tk.bg2, borderRadius: 12, border: `1px solid ${tk.violet}44` }}>
            <Label color={tk.violet}>Decision Tree</Label>
            <pre style={{ fontSize: 12, color: tk.textDim, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{`Shortest/min steps?
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
                <div style={{ fontSize: 14, fontWeight: 800, color: tk.accent, marginBottom: 10, fontFamily: tk.mono }}>
                  {String(idx + 1).padStart(2, "0")}. {item.pattern}
                </div>
                <div style={{ fontSize: 12, color: tk.textDim, marginBottom: 8 }}>
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>WHEN: </span>{item.when}
                </div>
                <div style={{ fontFamily: tk.mono, fontSize: 11, padding: "8px 12px", background: tk.bg3, borderRadius: 6, color: tk.accent, marginBottom: 8 }}>
                  {item.template}
                </div>
                <div style={{ fontSize: 11, color: tk.violet }}>💡 {item.tip}</div>
                {item.problems && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {item.problems.map((pb, i) => (
                      <span key={i} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: tk.bg3, color: tk.textDim, border: `1px solid ${tk.border}` }}>{pb}</span>
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
            <h2 style={{ color: tk.textBright, fontSize: 18, margin: "0 0 4px", fontWeight: 800 }}>C++ Deep Dive</h2>
            <P style={{ opacity: 0.5, fontSize: 13, margin: 0 }}>Compiler-level concepts asked at Apple, Nvidia, Qualcomm, AMD — lvalue/rvalue, move semantics, vtable, UB, atomics</P>
          </div>

          {CPP_CONCEPTS.map(concept => (
            <div key={concept.id} style={{ background: tk.bg2, borderRadius: 12, border: `1px solid ${expandedCpp === concept.id ? tk.accent + "66" : tk.border}`, overflow: "hidden" }}>
              {/* Concept Header — clickable */}
              <button
                onClick={() => setExpandedCpp(expandedCpp === concept.id ? null : concept.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "16px 20px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left", color: tk.text,
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: 6, background: tk.accent + "22", color: tk.accent, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {String(concept.id).padStart(2, "0")}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: tk.textBright }}>{concept.title}</div>
                  <div style={{ fontSize: 11, color: tk.textDim, marginTop: 2 }}>{concept.category}</div>
                </div>
                <Badge color={tk.accent + "22"} textColor={tk.accent}>{concept.qa.length} Q&As</Badge>
                <span style={{ color: tk.textDim, fontSize: 14, transform: expandedCpp === concept.id ? "rotate(90deg)" : "none", transition: "0.2s" }}>▶</span>
              </button>

              {expandedCpp === concept.id && (
                <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${tk.border}` }}>
                  {/* Explanation */}
                  <div style={{ marginTop: 16, padding: 16, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${tk.accent}` }}>
                    <Label>Concept Overview</Label>
                    <P style={{ fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>{concept.explanation}</P>
                  </div>

                  {/* Key Insight */}
                  <div style={{ marginTop: 12, padding: 14, background: tk.bg3, borderRadius: 8, borderLeft: `4px solid ${tk.violet}` }}>
                    <Label color={tk.violet}>Key Insight</Label>
                    <P style={{ fontSize: "0.9rem", lineHeight: 1.65, margin: 0, fontStyle: "italic", color: tk.textBright }}>{concept.keyInsight}</P>
                  </div>

                  {/* Code Example */}
                  <div style={{ marginTop: 16 }}>
                    <Label color="#22d3ee">Reference Code</Label>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${tk.border}` }}>
                      <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                        customStyle={{ margin: 0, padding: "20px", fontSize: "0.82rem", background: tk.bg3, lineHeight: 1.65 }}>
                        {concept.codeExample}
                      </SyntaxHighlighter>
                    </div>
                  </div>

                  {/* Q&A Cards */}
                  <div style={{ marginTop: 20 }}>
                    <Label color="#f59e0b">Interview Q&A</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {concept.qa.map((qa, qIdx) => {
                        const qaKey = `${concept.id}-${qIdx}`;
                        const open = expandedQA[qaKey];
                        return (
                          <div key={qIdx} style={{ background: tk.bg, borderRadius: 8, border: `1px solid ${open ? "#f59e0b55" : tk.border}`, overflow: "hidden" }}>
                            {/* Question header */}
                            <button
                              onClick={() => setExpandedQA(prev => ({ ...prev, [qaKey]: !prev[qaKey] }))}
                              style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }}
                            >
                              <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 4, background: qa.willCompile ? "#22c55e22" : "#ef444422", color: qa.willCompile ? "#22c55e" : "#ef4444", flexShrink: 0, marginTop: 1 }}>
                                {qa.willCompile ? "COMPILES" : "ERROR"}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${tk.border}` }}>
                                  <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                                    customStyle={{ margin: 0, padding: "12px 14px", fontSize: "0.8rem", background: "#0a0a14", lineHeight: 1.6 }}>
                                    {qa.question}
                                  </SyntaxHighlighter>
                                </div>
                              </div>
                              <span style={{ color: tk.textDim, fontSize: 12, transform: open ? "rotate(90deg)" : "none", transition: "0.2s", flexShrink: 0 }}>▶</span>
                            </button>

                            {open && (
                              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${tk.border}` }}>
                                {/* Answer */}
                                <div style={{ marginTop: 12, padding: 14, background: tk.bg2, borderRadius: 8, borderLeft: `4px solid ${qa.willCompile ? "#22c55e" : "#ef4444"}` }}>
                                  <Label color={qa.willCompile ? "#22c55e" : "#ef4444"}>Answer</Label>
                                  <P style={{ fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>{qa.answer}</P>
                                </div>

                                {/* Fixed Code */}
                                {qa.fixedCode && (
                                  <div style={{ marginTop: 12 }}>
                                    <Label color="#22c55e">Fix / Correct Code</Label>
                                    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid #22c55e33` }}>
                                      <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: "14px 16px", fontSize: "0.8rem", background: tk.bg3, lineHeight: 1.65 }}>
                                        {qa.fixedCode}
                                      </SyntaxHighlighter>
                                    </div>
                                  </div>
                                )}

                                {/* Explanation */}
                                <div style={{ marginTop: 12, padding: 12, background: tk.bg2, borderRadius: 8, borderLeft: `4px solid ${tk.violet}` }}>
                                  <Label color={tk.violet}>Deep Explanation</Label>
                                  <P style={{ fontSize: "0.88rem", lineHeight: 1.65, margin: 0, color: tk.textDim }}>{qa.explanation}</P>
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
            <h2 style={{ color: tk.textBright, fontSize: 18, margin: "0 0 4px", fontWeight: 800 }}>Interview Tips & Insights</h2>
            <P style={{ opacity: 0.5, fontSize: 13, margin: 0 }}>Pattern recognition, complexity guides, STL reference, common mistakes, and communication strategy</P>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 20 }}>
            {TIPS.map((section, idx) => {
              const accent = [tk.accent, tk.violet, "#22d3ee", "#f59e0b", "#f472b6", "#4ade80"][idx % 6];
              return (
                <div key={idx} style={{ background: tk.bg2, borderRadius: 12, padding: 20, border: `1px solid ${tk.border}`, borderTop: `3px solid ${accent}` }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: accent, margin: "0 0 14px", letterSpacing: 0.5 }}>{section.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {section.tips.map((tip, tidx) => (
                      <div key={tidx} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.6, color: tk.textDim }}>
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
            <h2 style={{ color: tk.textBright, fontSize: 20, margin: "0 0 4px", fontWeight: 900 }}>
              🐛 Bug Hunt — <span style={{ color: "#ef4444" }}>NVIDIA Code Reading Exercises</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize: 13, margin: 0 }}>
              Based on real NVIDIA compiler verification interview format. Read code → identify bugs → explain → fix. Talk out loud!
            </P>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {NVIDIA_BUG_HUNT.map((exercise) => (
              <div key={exercise.id} style={{
                background: tk.bg2, borderRadius: 14, border: `1px solid ${tk.border}`,
                borderLeft: `4px solid #ef4444`, overflow: "hidden"
              }}>
                {/* Header */}
                <div
                  style={{ padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setExpandedBug(expandedBug === exercise.id ? null : exercise.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#ef4444", fontFamily: tk.mono, fontWeight: 900, fontSize: 13 }}>#{exercise.id.toString().padStart(2,"0")}</span>
                    <div>
                      <div style={{ color: tk.textBright, fontWeight: 800, fontSize: 15 }}>{exercise.title}</div>
                      <div style={{ color: tk.textDim, fontSize: 11, marginTop: 2 }}>{exercise.category}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 10, padding: "3px 9px", borderRadius: 4, fontWeight: 800,
                      background: exercise.difficulty === "High Probability" ? "#ef444433" : "#f59e0b33",
                      color: exercise.difficulty === "High Probability" ? "#ef4444" : "#f59e0b",
                    }}>{exercise.difficulty}</span>
                    <span style={{ color: tk.textDim, fontSize: 18, lineHeight: 1 }}>{expandedBug === exercise.id ? "−" : "+"}</span>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedBug === exercise.id && (
                  <div style={{ padding: "0 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Buggy Code */}
                    <div>
                      <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ BUGGY CODE — FIND THE BUGS</div>
                      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid #ef444444` }}>
                        <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: "18px", fontSize: "0.82rem", background: "#1a0d0d", lineHeight: 1.65 }}>
                          {exercise.buggyCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* Bug List */}
                    <div style={{ background: "#1f0a0a", borderRadius: 8, padding: "14px 18px", border: `1px solid #ef444422` }}>
                      <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 800, fontFamily: tk.mono, marginBottom: 8, letterSpacing: 1 }}>▸ BUGS FOUND</div>
                      {exercise.bugs.map((bug, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.6, color: "#fca5a5", marginBottom: 4 }}>
                          <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                          <span>{bug}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fixed Code */}
                    <div>
                      <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ FIXED CODE</div>
                      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid #22c55e44` }}>
                        <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: "18px", fontSize: "0.82rem", background: "#0a1a0d", lineHeight: 1.65 }}>
                          {exercise.fixedCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* What to say */}
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "14px 18px", borderLeft: `3px solid ${tk.accent}` }}>
                      <div style={{ fontSize: 10, color: tk.accent, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6, letterSpacing: 1 }}>▸ WHAT TO SAY OUT LOUD</div>
                      <P style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: tk.textDim }}>{exercise.whatToSay}</P>
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
            <h2 style={{ color: tk.textBright, fontSize: 20, margin: "0 0 4px", fontWeight: 900 }}>
              ⚡ C++ Output Quiz — <span style={{ color: tk.accent }}>Tricky Snippets</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize: 13, margin: 0 }}>
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
                      <span style={{ fontSize: 10, color: tk.accent, fontFamily: tk.mono, fontWeight: 800 }}>Q{quiz.id.toString().padStart(2,"0")} · {quiz.category}</span>
                      <div style={{ color: tk.textBright, fontWeight: 800, fontSize: 14, marginTop: 3 }}>{quiz.title}</div>
                    </div>
                    <span style={{ color: tk.textDim, fontSize: 18 }}>{expandedQuiz === quiz.id ? "−" : "+"}</span>
                  </div>

                  {/* Always show code snippet */}
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${tk.border}`, marginTop: 12 }}>
                    <SyntaxHighlighter language="cpp" style={vscDarkPlus}
                      customStyle={{ margin: 0, padding: "14px", fontSize: "0.79rem", background: tk.bg3, lineHeight: 1.6 }}>
                      {quiz.code}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Answer */}
                {expandedQuiz === quiz.id && (
                  <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "#0d1f0d", borderRadius: 8, padding: "12px 16px", border: `1px solid #22c55e44` }}>
                      <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 800, fontFamily: tk.mono, marginBottom: 4 }}>▸ CORRECT OUTPUT</div>
                      <P style={{ fontSize: 14, fontWeight: 700, color: "#86efac", margin: 0, fontFamily: tk.mono }}>{quiz.correctAnswer}</P>
                    </div>
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${tk.violet}` }}>
                      <div style={{ fontSize: 10, color: tk.violet, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6 }}>▸ EXPLANATION</div>
                      <P style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: tk.textDim }}>{quiz.explanation}</P>
                    </div>
                    <div style={{ background: tk.bg3, borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${tk.accent}` }}>
                      <div style={{ fontSize: 10, color: tk.accent, fontWeight: 800, fontFamily: tk.mono, marginBottom: 6 }}>▸ KEY INSIGHT</div>
                      <P style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: tk.textDim }}>{quiz.keyInsight}</P>
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
            <h2 style={{ color: tk.textBright, fontSize: 20, margin: "0 0 4px", fontWeight: 900 }}>
              🎯 NVIDIA Compiler Verification — <span style={{ color: "#ef4444" }}>Interview Strategy</span>
            </h2>
            <P style={{ opacity: 0.55, fontSize: 13, margin: 0 }}>
              Role-specific preparation for the NVIDIA Compiler Verification Associate Engineer round. Real format, real bugs, real strategy.
            </P>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 20 }}>
            {NVIDIA_TIPS.map((section, idx) => {
              const accent = ["#ef4444", "#f59e0b", "#22c55e", "#38bdf8", "#a855f7", "#06d6a0"][idx % 6];
              return (
                <div key={idx} style={{
                  background: tk.bg2, borderRadius: 12, padding: 20,
                  border: `1px solid ${tk.border}`, borderTop: `3px solid ${accent}`
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: accent, margin: "0 0 14px" }}>{section.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {section.tips.map((tip, tidx) => (
                      <div key={tidx} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.65, color: tk.textDim }}>
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
