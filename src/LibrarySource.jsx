import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tk, TabBanner } from './App';
import { alpha, useSyntaxTheme } from './theme.jsx';

const mdModules = import.meta.glob('./source/*.md', { query: '?raw', import: 'default', eager: true });

function parseMetadata(content) {
  const match = content.match(/<!--\n([\s\S]*?)\n-->/);
  const metadata = { category: 'Uncategorized', tags: '', difficulty: '', readTime: '' };
  let cleanContent = content;
  if (match) {
    match[1].split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        metadata[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });
    cleanContent = content.replace(match[0], '').trim();
  }
  return { metadata, cleanContent };
}

// Recursively extract all text from ReactMarkdown children (handles bold, code, etc.)
function flattenChildren(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(flattenChildren).join('');
  if (children?.props?.children) return flattenChildren(children.props.children);
  return '';
}

function makeId(children) {
  return flattenChildren(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Strip <a id="x"></a> anchor tags, build a mapping of anchorId → headingId
function preprocessMarkdown(content) {
  const anchorToHeadingId = {};
  const anchorHeadingRe = /<a\s+id="([^"]+)"\s*><\/a>\s*\r?\n+\s*(#{1,3})\s+(.+)/g;
  let m;
  while ((m = anchorHeadingRe.exec(content)) !== null) {
    const [, anchorId, , headingText] = m;
    const cleanText = headingText
      .replace(/<[^>]+>/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*?([^*]+)\*\*?/g, '$1');
    const headingId = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    anchorToHeadingId[anchorId] = headingId;
  }
  // Strip all bare anchor tags (with or without closing tag variations)
  let processed = content.replace(/<a\s+id="[^"]+"\s*(?:\/>|><\/a>)/g, '');
  // Drop the leading H1 — the file header already renders the title (avoids a duplicate).
  processed = processed.replace(/^\s*#\s+.+(?:\r?\n)+/, '');
  return { processed, anchorToHeadingId };
}

const files = Object.keys(mdModules).map(path => {
  const name = path.split('/').pop().replace('.md', '');
  const rawContent = mdModules[path];
  const { metadata, cleanContent } = parseMetadata(rawContent);
  const titleMatch = cleanContent.match(/^#\s+(.*)/m);
  const title = titleMatch ? titleMatch[1] : name;
  return { path, name, title, rawContent, cleanContent, metadata };
});

// Find a guide by its 2-digit numeric prefix (e.g. "13" → 13_aarch64_architecture).
// Used by the suggested-tracks panel and by inline cross-guide links (#guide/13[/anchor]).
const guideByNum = (num) => files.find(f => f.name.startsWith(String(num)));
const shortTitle = (f) => f.title.split(/[:—]/)[0].trim();

// ── Task 3: suggested learning tracks ──────────────────────────────
const TRACKS = [
  { name: "Fundamentals First", color: tk.emerald, nums: ["01", "02", "03", "04"], blurb: "The compiler spine — read in order." },
  { name: "C++ Depth", color: tk.accent, nums: ["05", "06", "07", "16"], blurb: "Language internals interviewers probe hard." },
  { name: "ARM / AArch64 Specialization", color: tk.violet, nums: ["13", "14", "15"], blurb: "The Qualcomm / Apple-Silicon track." },
  { name: "Domain Specializations", color: tk.amber, nums: ["08", "09", "10"], blurb: "Pick the one matching your target team." },
  { name: "Tooling & Interview", color: tk.cyan, nums: ["11", "12"], blurb: "Commands + scenario playbook for the night before." },
];

// "Prepping for X in 5 days? read these 4"
const QUICKPICKS = [
  { name: "Qualcomm AArch64 backend", nums: ["13", "14", "15", "10"] },
  { name: "NVIDIA / GPU compiler", nums: ["01", "02", "08", "09"] },
  { name: "C++-heavy systems round", nums: ["05", "06", "07", "16"] },
  { name: "LLVM fundamentals crash", nums: ["01", "02", "03", "11"] },
];

export default function LibrarySource({ setMode, target }) {
  const syn = useSyntaxTheme();   // syntax highlighting follows the app theme
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHome, setShowHome] = useState(true);   // Task 3: open on the tracks landing

  const sortedFiles = useMemo(() => [...files].sort((a, b) => a.name.localeCompare(b.name)), []);

  const [activeFile, setActiveFile] = useState(sortedFiles[0] || null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [activeHeader, setActiveHeader] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollRef = useRef(null);
  const pendingAnchorRef = useRef(null);   // anchor to scroll to after a cross-guide jump

  // Open a guide (from sidebar, tracks panel, or an inline cross-guide link)
  const openGuide = useCallback((file, anchor = null) => {
    if (!file) return;
    pendingAnchorRef.current = anchor;
    setShowHome(false);
    setActiveFile(file);
    setSidebarOpen(false);
  }, []);

  // Respond to a cross-tab jump (from global search or a Prep deep-dive link).
  useEffect(() => {
    if (target && target.num) {
      const f = guideByNum(target.num);
      if (f) openGuide(f, target.anchor || null);
    }
  }, [target, openGuide]);

  // Pre-process active file content: strip <a id> tags, build anchor map
  const { processedContent, anchorMapping } = useMemo(() => {
    if (!activeFile) return { processedContent: '', anchorMapping: {} };
    const { processed, anchorToHeadingId } = preprocessMarkdown(activeFile.cleanContent);
    return { processedContent: processed, anchorMapping: anchorToHeadingId };
  }, [activeFile]);

  // Group files by category
  const categories = useMemo(() => {
    const cats = {};
    sortedFiles.forEach(f => {
      const cat = f.metadata.category || 'Other';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(f);
    });
    return cats;
  }, [sortedFiles]);

  // Build TOC from headings in processed content
  useEffect(() => {
    if (!activeFile) return;
    const headers = [];
    processedContent.split('\n').forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (!match) return;
      if (match[1] === '#' && match[2].trim() === activeFile.title.trim()) return;
      const rawText = match[2]
        .replace(/<[^>]+>/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*?([^*]+)\*\*?/g, '$1')
        .trim();
      headers.push({
        level: match[1].length,
        text: rawText,
        id: rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      });
    });
    setToc(headers);
    setScrollProgress(0);
    setShowBackToTop(false);
    setActiveHeader('');
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    // If we arrived here via a cross-guide link with an #anchor, scroll to it
    // once the new content has painted.
    if (pendingAnchorRef.current) {
      const anchor = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToHeader(anchor)));
    }
  }, [activeFile, processedContent]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    const max = el.scrollHeight - el.clientHeight;
    const progress = max > 0 ? (el.scrollTop / max) * 100 : 0;
    setScrollProgress(progress);
    setShowBackToTop(el.scrollTop > 300);

    // Scroll spy using getBoundingClientRect (accurate in any nesting)
    const containerTop = el.getBoundingClientRect().top;
    const headingEls = Array.from(el.querySelectorAll('h1[id], h2[id], h3[id]'));
    let current = '';
    for (let i = headingEls.length - 1; i >= 0; i--) {
      const top = headingEls[i].getBoundingClientRect().top - containerTop;
      if (top <= 80) { current = headingEls[i].id; break; }
    }
    setActiveHeader(current);
  }, []);

  const scrollToHeader = useCallback((id) => {
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector(`[id="${CSS.escape(id)}"]`);
    if (!el) return;
    const elTop = el.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    container.scrollBy({ top: elTop - containerTop - 24, behavior: 'smooth' });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredCategories = useMemo(() => {
    const result = {};
    Object.keys(categories).forEach(cat => {
      const q = search.toLowerCase();
      const filtered = categories[cat].filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.metadata.tags.toLowerCase().includes(q)
      );
      if (filtered.length) result[cat] = filtered;
    });
    return result;
  }, [categories, search]);

  // Shared heading renderer
  const makeHeading = (Tag) => ({ node, children, ...props }) => {
    const id = makeId(children);
    return <Tag id={id} {...props}>{children}</Tag>;
  };

  const mdComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div style={{ margin: '24px 0', borderRadius: 10, overflow: 'hidden', border: `1px solid ${tk.border}`, boxShadow: tk.shadowMd }}>
          <div style={{ background: tk.codeTitleBg, borderBottom: `1px solid ${tk.border}`, padding: '8px 16px', fontSize:"var(--fs-xs)", color: tk.textDim, fontFamily: tk.mono, letterSpacing: .5, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8, color: tk.emerald }}>■</span>{match[1].toUpperCase()}
          </div>
          <SyntaxHighlighter
            {...props}
            children={String(children).replace(/\n$/, '')}
            style={syn}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, background: tk.codeBg, padding: '16px 20px', fontSize:"var(--fs-code)", lineHeight: 1.7, fontFamily: tk.mono }}
          />
        </div>
      ) : (
        <code {...props} className={className} style={{ background: tk.bg3, padding: '3px 6px', borderRadius: 4, color: tk.cyan, fontFamily: tk.mono, fontSize: '0.9em', border: `1px solid ${tk.border}` }}>
          {children}
        </code>
      );
    },
    h1: makeHeading('h1'),
    h2: makeHeading('h2'),
    h3: makeHeading('h3'),
    a({ node, href, children, ...props }) {
      // Cross-guide links: #guide/13 or #guide/13/some-heading-id → switch active file
      if (href?.startsWith('#guide/')) {
        const rest = href.slice('#guide/'.length);
        const slash = rest.indexOf('/');
        const num = slash === -1 ? rest : rest.slice(0, slash);
        const anchor = slash === -1 ? null : rest.slice(slash + 1);
        const target = guideByNum(num);
        return (
          <a
            href={href}
            onClick={(e) => { e.preventDefault(); openGuide(target, anchor); }}
            style={{ color: tk.emerald, cursor: 'pointer', textDecoration: 'none', fontWeight: 700 }}
            title={target ? `Open ${target.title}` : undefined}
            {...props}
          >
            {children}
          </a>
        );
      }
      // Hash links: resolve anchor mapping (e.g. #section-1 → actual heading id)
      if (href?.startsWith('#')) {
        const rawId = href.slice(1);
        const resolvedId = anchorMapping[rawId] || rawId;
        return (
          <a
            href={href}
            onClick={(e) => { e.preventDefault(); scrollToHeader(resolvedId); }}
            style={{ color: tk.emerald, cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: tk.emerald, textDecoration: 'none', fontWeight: 600 }}
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote({ node, children, ...props }) {
      const childrenArray = React.Children.toArray(children);
      const first = childrenArray[0];
      if (React.isValidElement(first) && first.type === 'p') {
        const pChildren = React.Children.toArray(first.props.children);
        const firstText = typeof pChildren[0] === 'string' ? pChildren[0] : '';
        const m = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
        if (m) {
          const type = m[1].toLowerCase();
          const newP = [...pChildren];
          newP[0] = firstText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, '');
          return (
            <blockquote className={`gh-alert gh-alert-${type}`} {...props}>
              <div className="gh-alert-title">{type.toUpperCase()}</div>
              <p>{newP}</p>
              {childrenArray.slice(1)}
            </blockquote>
          );
        }
      }
      return <blockquote {...props}>{children}</blockquote>;
    },
    table({ children, ...props }) {
      return (
        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table {...props}>{children}</table>
        </div>
      );
    },
    // eslint-disable-next-line no-unused-vars
  }), [anchorMapping, scrollToHeader, openGuide, syn]);

  const trackChipStyle = {
    background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 6,
    color: tk.text, fontSize:"var(--fs-xs)", fontFamily: tk.sans, cursor: 'pointer',
    padding: '5px 10px', transition: 'all .12s', display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  const chipHover = (on, color) => (e) => {
    e.currentTarget.style.borderColor = on ? (color || tk.emerald) : tk.border;
    e.currentTarget.style.color = on ? tk.textBright : tk.text;
  };

  const renderHome = () => (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <TabBanner mode="library" setMode={setMode} />

      <div style={{ marginBottom: 28, borderBottom: `1px solid ${tk.border}`, paddingBottom: 20 }}>
        <div style={{ fontFamily: tk.mono, color: tk.emerald, fontSize:"var(--fs-xs)", letterSpacing: '.12em', fontWeight: 800, marginBottom: 8 }}>◆ LIBRARY · LEARN</div>
        <h1 style={{ margin: '0 0 10px', fontSize:"var(--fs-3xl)", fontWeight: 900, color: tk.textBright, lineHeight: 1.2 }}>Deep-Dive Guides</h1>
        <p style={{ color: tk.textDim, fontSize:"var(--fs-base)", margin: 0, lineHeight: 1.65, maxWidth: 760 }}>
          {files.length} long-form references. New here? Follow a track in order. Short on time? Take a 5-day quick-pick. Every guide opens with a <strong style={{ color: tk.text }}>TL;DR</strong> so you can decide in 10 seconds whether to (re)read it.
        </p>
      </div>

      {/* Suggested Tracks */}
      <div style={{ fontSize:"var(--fs-xs)", color: tk.textDim, fontFamily: tk.mono, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Suggested Tracks</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 36 }}>
        {TRACKS.map(tr => (
          <div key={tr.name} style={{ background: tk.bg2, border: `1px solid ${tk.border}`, borderTop: `3px solid ${tr.color}`, borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ color: tr.color, fontWeight: 800, fontSize:"var(--fs-base)", marginBottom: 4 }}>{tr.name}</div>
            <div style={{ color: tk.textDim, fontSize:"var(--fs-sm)", marginBottom: 14, lineHeight: 1.5 }}>{tr.blurb}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {tr.nums.map((n, i) => {
                const f = guideByNum(n);
                if (!f) return null;
                return (
                  <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span style={{ color: tk.border, fontSize:"var(--fs-sm)" }}>→</span>}
                    <button onClick={() => openGuide(f)} style={trackChipStyle}
                      onMouseEnter={chipHover(true, tr.color)} onMouseLeave={chipHover(false)}>
                      <span style={{ opacity: 0.5, fontFamily: tk.mono, fontSize:"var(--fs-caption)" }}>{n}</span>{shortTitle(f)}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5-day quick-picks */}
      <div style={{ background: tk.calloutTip, border: `1px solid ${alpha(tk.emerald,"40")}`, borderLeft: `4px solid ${tk.emerald}`, borderRadius: 8, padding: '18px 20px' }}>
        <div style={{ color: tk.emerald, fontWeight: 800, fontSize:"var(--fs-base)", marginBottom: 4 }}>✦ Prepping for one team in 5 days? Read these 4.</div>
        <div style={{ color: tk.textDim, fontSize:"var(--fs-sm)", marginBottom: 14 }}>Curated crash paths — one guide a day, with a re-skim on day 5.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {QUICKPICKS.map(qp => (
            <div key={qp.name} style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ color: tk.text, fontWeight: 700, fontSize:"var(--fs-sm)", marginBottom: 10 }}>{qp.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {qp.nums.map(n => {
                  const f = guideByNum(n);
                  if (!f) return null;
                  return (
                    <button key={n} onClick={() => openGuide(f)} title={f.title}
                      style={{ ...trackChipStyle, fontFamily: tk.mono, fontSize:"var(--fs-xs)" }}
                      onMouseEnter={chipHover(true, tk.emerald)} onMouseLeave={chipHover(false)}>
                      {n} · {shortTitle(f)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      {/* Read progress bar */}
      <div style={{ height: 3, width: '100%', background: tk.bg2, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${scrollProgress}%`, background: tk.emerald, transition: 'width 0.1s' }} />
      </div>

      <div className="library-layout">
        {/* Mobile menu button */}
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <nav className={`library-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${tk.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: tk.mono, color: tk.emerald, fontSize:"var(--fs-xs)", letterSpacing: '.12em', fontWeight: 800 }}>LIBRARY SOURCE</div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse sidebar"
                style={{ background: 'transparent', border: `1px solid ${tk.border}`, borderRadius: 5, color: tk.textDim, cursor: 'pointer', padding: '3px 7px', fontSize:"var(--fs-sm)", fontFamily: tk.mono, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = tk.textBright; e.currentTarget.style.borderColor = tk.borderLight; }}
                onMouseLeave={e => { e.currentTarget.style.color = tk.textDim; e.currentTarget.style.borderColor = tk.border; }}
              >
                ◀
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search files or tags…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 32px 8px 12px', marginBottom: 12,
                  background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 6,
                  color: tk.text, fontSize:"var(--fs-md)", fontFamily: tk.sans, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = tk.emerald}
                onBlur={e => e.target.style.borderColor = tk.border}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-60%)', background: 'transparent', border: 'none', color: tk.textDim, cursor: 'pointer', fontSize:"var(--fs-base)", padding: 0, lineHeight: 1 }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', background: tk.bg, borderRadius: 6, padding: 2, border: `1px solid ${tk.border}` }}>
              {[['compiler', 'PREP'], ['dsa', 'DSA'], ['library', 'LIB']].map(([mode, label]) => (
                <div
                  key={mode}
                  onClick={() => setMode(mode)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '6px 0', fontSize:"var(--fs-caption)", fontFamily: tk.mono,
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s',
                    background: mode === 'library' ? alpha(tk.emerald,"22") : 'transparent',
                    color: mode === 'library' ? tk.emerald : tk.textDim,
                    fontWeight: mode === 'library' ? 800 : 400,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {/* Home / Learning Tracks */}
            <div
              onClick={() => { setShowHome(true); setSidebarOpen(false); }}
              style={{
                margin: '0 12px 12px', padding: '9px 12px', cursor: 'pointer', borderRadius: 6,
                background: showHome ? alpha(tk.emerald,"12") : 'transparent',
                border: `1px solid ${showHome ? alpha(tk.emerald,"55") : tk.border}`,
                color: showHome ? tk.emerald : tk.textDim,
                fontFamily: tk.mono, fontSize:"var(--fs-xs)", fontWeight: 700, letterSpacing: '.04em',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all .12s',
              }}
              onMouseEnter={e => { if (!showHome) { e.currentTarget.style.borderColor = alpha(tk.emerald,"44"); e.currentTarget.style.color = tk.text; } }}
              onMouseLeave={e => { if (!showHome) { e.currentTarget.style.borderColor = tk.border; e.currentTarget.style.color = tk.textDim; } }}
            >
              ⌂ HOME · LEARNING TRACKS
            </div>
            {Object.keys(filteredCategories).length === 0 && (
              <div style={{ padding: '20px 16px', color: tk.textDim, fontFamily: tk.sans, fontSize:"var(--fs-md)" }}>No results for "{search}"</div>
            )}
            {Object.keys(filteredCategories).map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ padding: '0 16px', fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
                  {cat}
                </div>
                {filteredCategories[cat].map(file => {
                  const isActive = !showHome && activeFile?.path === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => openGuide(file)}
                      style={{
                        padding: '9px 16px 9px 20px', cursor: 'pointer',
                        background: isActive ? alpha(tk.emerald,"12") : 'transparent',
                        borderLeft: isActive ? `2px solid ${tk.emerald}` : '2px solid transparent',
                        transition: 'all .12s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = alpha(tk.textBright,"08"); }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ fontSize:"var(--fs-md)", color: isActive ? tk.textBright : tk.text, fontFamily: tk.sans, lineHeight: 1.35, fontWeight: isActive ? 600 : 400 }}>
                        {file.title}
                      </div>
                      {file.metadata.readTime && (
                        <div style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono, marginTop: 3 }}>
                          ⏱ {file.metadata.readTime} · {file.metadata.difficulty}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* ── Collapsed sidebar tab ── */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            style={{
              position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
              zIndex: 50, background: tk.bg2, border: `1px solid ${tk.border}`,
              borderLeft: 'none', borderRadius: '0 8px 8px 0',
              color: tk.emerald, cursor: 'pointer', padding: '14px 7px',
              fontSize:"var(--fs-sm)", fontFamily: tk.mono, fontWeight: 700,
              boxShadow: tk.shadowMd,
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              letterSpacing: 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = alpha(tk.emerald,"22"); }}
            onMouseLeave={e => { e.currentTarget.style.background = tk.bg2; }}
          >
            ▶ MENU
          </button>
        )}

        {/* ── Main Content ── */}
        <main ref={scrollRef} className="scroll-container library-main" onScroll={handleScroll}>
          <div style={{ display: 'flex', width: '100%' }}>

            {/* Article */}
            <div className="markdown-body library-content">
              {showHome ? renderHome() : activeFile ? (
                <>
                  {/* File header */}
                  <div style={{ marginBottom: 28, borderBottom: `1px solid ${tk.border}`, paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono }}>{activeFile.metadata.category}</span>
                      {activeFile.metadata.difficulty && (
                        <>
                          <span style={{ color: tk.border }}>·</span>
                          <span style={{ fontSize:"var(--fs-caption)", color: tk.amber, fontFamily: tk.mono }}>{activeFile.metadata.difficulty}</span>
                        </>
                      )}
                      {activeFile.metadata.readTime && (
                        <>
                          <span style={{ color: tk.border }}>·</span>
                          <span style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono }}>⏱ {activeFile.metadata.readTime}</span>
                        </>
                      )}
                    </div>
                    <h1 style={{ margin: '0 0 12px', fontSize:"var(--fs-3xl)", fontWeight: 900, color: tk.textBright, lineHeight: 1.2 }}>
                      {activeFile.title}
                    </h1>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {activeFile.metadata.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} style={{ fontSize:"var(--fs-caption)", background: alpha(tk.emerald,"20"), color: tk.emerald, padding: '2px 8px', borderRadius: 4, fontFamily: tk.mono, border: `1px solid ${alpha(tk.emerald,"30")}` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {processedContent}
                  </ReactMarkdown>
                </>
              ) : (
                <div style={{ color: tk.textDim, fontFamily: tk.mono, padding: 40, textAlign: 'center' }}>No files found.</div>
              )}
            </div>

            {/* ── Right TOC ── */}
            {!showHome && toc.length > 0 && (
              <div className="library-toc">
                <div style={{ fontSize:"var(--fs-caption)", color: tk.textDim, fontFamily: tk.mono, fontWeight: 800, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
                  On this page
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {toc.map((item, idx) => {
                    const isActive = activeHeader === item.id;
                    return (
                      <button
                        key={idx}
                        onClick={() => scrollToHeader(item.id)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: isActive ? alpha(tk.emerald,"12") : 'transparent',
                          border: 'none',
                          borderLeft: `2px solid ${isActive ? tk.emerald : 'transparent'}`,
                          borderRadius: '0 4px 4px 0',
                          padding: `5px 8px 5px ${6 + (item.level - 1) * 10}px`,
                          cursor: 'pointer',
                          fontSize: item.level === 2 ? "var(--fs-sm)" : "var(--fs-xs)",
                          color: isActive ? tk.emerald : tk.textDim,
                          fontFamily: tk.sans,
                          lineHeight: 1.45,
                          transition: 'all 0.12s',
                          fontWeight: isActive ? 600 : 400,
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = tk.text; e.currentTarget.style.borderLeftColor = tk.borderLight; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = tk.textDim; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
                      >
                        {item.text}
                      </button>
                    );
                  })}
                </div>

                {/* Back to top */}
                <button
                  onClick={scrollToTop}
                  style={{
                    marginTop: 20, width: '100%', padding: '7px 0',
                    background: 'transparent', border: `1px solid ${tk.border}`,
                    borderRadius: 6, color: tk.textDim, cursor: 'pointer',
                    fontSize:"var(--fs-xs)", fontFamily: tk.mono, fontWeight: 600,
                    letterSpacing: 0.5, transition: 'all 0.15s',
                    opacity: showBackToTop ? 1 : 0,
                    pointerEvents: showBackToTop ? 'auto' : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = alpha(tk.emerald,"12"); e.currentTarget.style.color = tk.emerald; e.currentTarget.style.borderColor = alpha(tk.emerald,"50"); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tk.textDim; e.currentTarget.style.borderColor = tk.border; }}
                >
                  ↑ BACK TO TOP
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
