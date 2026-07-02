/* ══════════════════════════════════════════════════════════════════════════
   THEME SYSTEM — single source of truth for both palettes.

   Architecture: every token is exposed as a CSS custom property
   (--tk-<key>) injected at module load for :root (dark) and
   :root[data-theme="light"]. The exported `tk` object keeps the exact
   same keys the codebase always used, but each value is now a
   `var(--tk-…)` reference — so the thousands of existing inline styles
   stay valid and become theme-aware for free. Toggling a theme is just
   flipping the data-theme attribute; nothing re-renders.

   A tiny React context carries the *mode* itself for the few places
   that need a JS value (the react-syntax-highlighter style object and
   the toggle button).
   ══════════════════════════════════════════════════════════════════════════ */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* ─── palettes ──────────────────────────────────────────────────────────── */
const dark = {
  colorScheme: "dark",
  // elevation layers — blue-tinted near-black, clearly separated
  bg: "#0b0e14", bg2: "#11151d", bg3: "#181e2a", bgAlt: "#0e1219",
  border: "rgba(148,163,184,0.16)", borderLight: "rgba(148,163,184,0.30)",
  text: "#e2e6ed", textDim: "#9aa5b4", textBright: "#ffffff",
  accent: "#4f8ff7", accentDim: "rgba(79,143,247,0.14)",
  blue: "#4f8ff7", blueDim: "rgba(79,143,247,0.14)",
  amber: "#f5a623", amberDim: "rgba(245,166,35,0.14)",
  red: "#f0504a", redDim: "rgba(240,80,74,0.14)",
  cyan: "#38cfe8", violet: "#a78bfa", rose: "#fb7185", orange: "#fb923c",
  emerald: "#2dbd85",
  // extended accent ramp (DSA section colors, badges, quiz states)
  green: "#31c45f", greenBright: "#4ade80", greenPale: "#86efac",
  yellow: "#e2b714", amberBright: "#fbbf24",
  sky: "#38bdf8", teal: "#22d3ee", tealDim: "#2dd4bf", mint: "#06d6a0",
  pink: "#f472b6", fuchsia: "#e879f9", purple: "#b06cf7", purpleLight: "#c084fc",
  violetPale: "#c4b5fd", indigo: "#818cf8", lime: "#a3e635",
  redSoft: "#f87171", redPale: "#fca5a5", roseSoft: "#fb7185",
  orangeSoft: "#fb923c", blueSoft: "#60a5fa", slate: "#7d8ba1",
  emeraldBright: "#34d399", cyanBright: "#67e8f9",
  // code blocks
  codeBg: "#0d1117", codeText: "#d6dce6", codeTitleBg: "#11151d",
  // callouts (B component / gh-alerts)
  calloutInfo: "#101a2b", calloutWarn: "#221a10", calloutTip: "#0d2018",
  calloutDanger: "#241213", calloutInterview: "#1a1430",
  // depth
  shadowSm: "0 1px 2px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.22)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.35)",
  shadowLg: "0 16px 48px rgba(0,0,0,0.5)",
  glow: "0 0 0 1px rgba(79,143,247,0.18), 0 0 18px rgba(79,143,247,0.14)",
  overlay: "rgba(2,4,10,0.66)",
  // diagrams
  diagramBg: "#0e1320", diagramDot: "rgba(148,163,184,0.14)",
  nodeBg: "#141a28", connector: "#55627a",
  heroTint: "#0e1b30",
  // markdown (Library)
  mdText: "#c3cad6", mdH3: "#d1fae5", mdLink: "#34d399",
  mdQuoteBg: "#10151f", mdThBg: "#0e2019", mdThText: "#6ee7b7",
  mdH1From: "#ffffff", mdH1To: "#6ee7b7",
  mdBulletGlow: "0 0 8px rgba(45,189,133,0.55)",
  scrollTrack: "#0b0e14", scrollThumb: "#2b3444", scrollThumbHover: "#4f8ff7",
};

const light = {
  colorScheme: "light",
  bg: "#f6f7f9", bg2: "#ffffff", bg3: "#eef1f6", bgAlt: "#fafbfd",
  border: "rgba(15,23,42,0.13)", borderLight: "rgba(15,23,42,0.24)",
  text: "#1f2430", textDim: "#5a6472", textBright: "#0b0f19",
  accent: "#2563eb", accentDim: "rgba(37,99,235,0.10)",
  blue: "#2563eb", blueDim: "rgba(37,99,235,0.10)",
  amber: "#b45309", amberDim: "rgba(180,83,9,0.10)",
  red: "#dc2626", redDim: "rgba(220,38,38,0.09)",
  cyan: "#0e7ea3", violet: "#7c3aed", rose: "#e11d48", orange: "#ea580c",
  emerald: "#0a8a60",
  green: "#16a34a", greenBright: "#15803d", greenPale: "#166534",
  yellow: "#a16207", amberBright: "#b45309",
  sky: "#0284c7", teal: "#0891b2", tealDim: "#0f766e", mint: "#059669",
  pink: "#db2777", fuchsia: "#c026d3", purple: "#9333ea", purpleLight: "#9333ea",
  violetPale: "#6d28d9", indigo: "#4f46e5", lime: "#65a30d",
  redSoft: "#dc2626", redPale: "#b91c1c", roseSoft: "#e11d48",
  orangeSoft: "#ea580c", blueSoft: "#2563eb", slate: "#64748b",
  emeraldBright: "#059669", cyanBright: "#0891b2",
  codeBg: "#f6f8fa", codeText: "#24292f", codeTitleBg: "#eef1f5",
  calloutInfo: "#eff5ff", calloutWarn: "#fdf6e7", calloutTip: "#eafaf2",
  calloutDanger: "#fdf0ef", calloutInterview: "#f4f1fd",
  shadowSm: "0 1px 2px rgba(15,23,42,0.05), 0 2px 8px rgba(15,23,42,0.05)",
  shadowMd: "0 4px 14px rgba(15,23,42,0.09)",
  shadowLg: "0 16px 48px rgba(15,23,42,0.18)",
  glow: "0 0 0 1px rgba(37,99,235,0.14), 0 2px 10px rgba(37,99,235,0.10)",
  overlay: "rgba(15,23,42,0.38)",
  diagramBg: "#f9fafc", diagramDot: "rgba(15,23,42,0.10)",
  nodeBg: "#ffffff", connector: "#94a3b8",
  heroTint: "#e8effc",
  mdText: "#2a3240", mdH3: "#065f46", mdLink: "#047857",
  mdQuoteBg: "#f2f6f4", mdThBg: "#e7f3ee", mdThText: "#047857",
  mdH1From: "#0b0f19", mdH1To: "#047857",
  mdBulletGlow: "none",
  scrollTrack: "#eef1f6", scrollThumb: "#c3cad6", scrollThumbHover: "#2563eb",
};

/* ─── type scale (theme-independent) ────────────────────────────────────── */
const FS = {
  caption: "10.5px",  // tiny mono overlines & badges       (was 9–10)
  xs: "11.5px",       // labels, chips, meta                 (was 10.5–11.5)
  sm: "12.75px",      // secondary UI text                   (was 12–12.5)
  md: "13.75px",      // dense UI body, tables               (was 13–13.5)
  base: "15px",       // standard body                       (was 14–14.5)
  lg: "16.5px",       // prose paragraphs                    (was 15–16)
  xl: "18px",         // card / section titles               (was 17–18)
  "2xl": "24px",      // page-level headings
  "3xl": "28px",      // hero headings
  code: "14px",       // code blocks                         (was 12.6–13)
};

/* ─── CSS injection (runs once at module load, before first paint) ─────── */
const toVars = (p) =>
  Object.entries(p)
    .map(([k, v]) => (k === "colorScheme" ? `color-scheme:${v};` : `--tk-${k}:${v};`))
    .join("");
const fsVars = Object.entries(FS).map(([k, v]) => `--fs-${k}:${v};`).join("");

/* Safe storage: no-ops gracefully where localStorage is unavailable. */
const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* no-op */ } },
};

const initialMode = () => {
  const saved = store.get("cp-theme");
  if (saved === "light" || saved === "dark") return saved;
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch { return "dark"; }
};

if (typeof document !== "undefined" && !document.getElementById("cp-theme-vars")) {
  const el = document.createElement("style");
  el.id = "cp-theme-vars";
  el.textContent =
    `:root{${fsVars}${toVars(dark)}}` +
    `:root[data-theme="light"]{${toVars(light)}}`;
  document.head.appendChild(el);
  document.documentElement.setAttribute("data-theme", initialMode());
}

/* ─── tk: same keys as ever, values are now var() references ────────────── */
export const tk = Object.keys(dark).reduce(
  (acc, k) => {
    if (k !== "colorScheme") acc[k] = `var(--tk-${k})`;
    return acc;
  },
  {
    mono: "'JetBrains Mono','Cascadia Code','Fira Code','SF Mono',Menlo,Consolas,monospace",
    sans: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
  }
);

/* Translucent tint of any color (replaces the old `hex + "22"` trick,
   which can't work on var() strings). Takes the same 2-digit hex alpha. */
export const alpha = (color, hex) =>
  `color-mix(in srgb, ${color} ${Math.round(parseInt(hex, 16) / 2.55)}%, transparent)`;

/* ─── mode context ──────────────────────────────────────────────────────── */
const ThemeCtx = createContext({ mode: "dark", toggle: () => {}, setMode: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    store.set("cp-theme", mode);
  }, [mode]);
  const toggle = useCallback(() => setMode((m) => (m === "dark" ? "light" : "dark")), []);
  return <ThemeCtx.Provider value={{ mode, toggle, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/* Syntax highlighting must switch with the app theme (style objects are JS,
   not CSS, so this is the one thing vars can't cover). */
export const useSyntaxTheme = () => (useTheme().mode === "dark" ? vscDarkPlus : oneLight);

/* ─── ready-made toggle control ─────────────────────────────────────────── */
const SunIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" />
  </svg>
);
const MoonIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.4 14.2A8.4 8.4 0 0 1 9.8 3.6a8.4 8.4 0 1 0 10.6 10.6Z" />
  </svg>
);

export function ThemeToggle({ style = {} }) {
  const { mode, toggle } = useTheme();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 38, height: 38, borderRadius: 999, cursor: "pointer",
        background: tk.bg2, color: tk.textDim,
        border: `1px solid ${tk.borderLight}`, boxShadow: tk.shadowMd,
        transition: "all .15s", ...style,
      }}
      onMouseOver={(e) => { e.currentTarget.style.color = tk.accent; e.currentTarget.style.borderColor = tk.accent; }}
      onMouseOut={(e) => { e.currentTarget.style.color = tk.textDim; e.currentTarget.style.borderColor = tk.borderLight; }}
    >
      {mode === "dark" ? SunIcon : MoonIcon}
    </button>
  );
}
