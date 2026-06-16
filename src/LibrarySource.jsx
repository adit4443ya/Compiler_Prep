import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { tk } from './App';

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
  const processed = content.replace(/<a\s+id="[^"]+"\s*(?:\/>|><\/a>)/g, '');
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

export default function LibrarySource({ setMode }) {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sortedFiles = useMemo(() => [...files].sort((a, b) => a.name.localeCompare(b.name)), []);

  const [activeFile, setActiveFile] = useState(sortedFiles[0] || null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [activeHeader, setActiveHeader] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollRef = useRef(null);

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
        <div style={{ margin: '24px 0', borderRadius: 10, overflow: 'hidden', border: `1px solid ${tk.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#111', borderBottom: `1px solid ${tk.border}`, padding: '8px 16px', fontSize: 11, color: tk.textDim, fontFamily: tk.mono, letterSpacing: .5, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8, color: '#10b981' }}>■</span>{match[1].toUpperCase()}
          </div>
          <SyntaxHighlighter
            {...props}
            children={String(children).replace(/\n$/, '')}
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, background: '#0a0a0a', padding: '16px 20px', fontSize: 13, lineHeight: 1.7, fontFamily: tk.mono }}
          />
        </div>
      ) : (
        <code {...props} className={className} style={{ background: '#1a1a1a', padding: '3px 6px', borderRadius: 4, color: tk.cyan, fontFamily: tk.mono, fontSize: '0.9em', border: `1px solid ${tk.border}` }}>
          {children}
        </code>
      );
    },
    h1: makeHeading('h1'),
    h2: makeHeading('h2'),
    h3: makeHeading('h3'),
    a({ node, href, children, ...props }) {
      // Hash links: resolve anchor mapping (e.g. #section-1 → actual heading id)
      if (href?.startsWith('#')) {
        const rawId = href.slice(1);
        const resolvedId = anchorMapping[rawId] || rawId;
        return (
          <a
            href={href}
            onClick={(e) => { e.preventDefault(); scrollToHeader(resolvedId); }}
            style={{ color: '#10b981', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
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
  }), [anchorMapping, scrollToHeader]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      {/* Read progress bar */}
      <div style={{ height: 3, width: '100%', background: tk.bg2, flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${scrollProgress}%`, background: '#10b981', transition: 'width 0.1s' }} />
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
              <div style={{ fontFamily: tk.mono, color: '#10b981', fontSize: 11, letterSpacing: '.12em', fontWeight: 800 }}>LIBRARY SOURCE</div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse sidebar"
                style={{ background: 'transparent', border: `1px solid ${tk.border}`, borderRadius: 5, color: tk.textDim, cursor: 'pointer', padding: '3px 7px', fontSize: 12, fontFamily: tk.mono, transition: 'all 0.15s' }}
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
                  background: '#0a0a0a', border: `1px solid ${tk.border}`, borderRadius: 6,
                  color: tk.text, fontSize: 13, fontFamily: tk.sans, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = tk.border}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-60%)', background: 'transparent', border: 'none', color: tk.textDim, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
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
                    flex: 1, textAlign: 'center', padding: '6px 0', fontSize: 10, fontFamily: tk.mono,
                    cursor: 'pointer', borderRadius: 4, transition: 'all 0.15s',
                    background: mode === 'library' ? '#10b98122' : 'transparent',
                    color: mode === 'library' ? '#10b981' : tk.textDim,
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
            {Object.keys(filteredCategories).length === 0 && (
              <div style={{ padding: '20px 16px', color: tk.textDim, fontFamily: tk.sans, fontSize: 13 }}>No results for "{search}"</div>
            )}
            {Object.keys(filteredCategories).map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ padding: '0 16px', fontSize: 10, color: tk.textDim, fontFamily: tk.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
                  {cat}
                </div>
                {filteredCategories[cat].map(file => {
                  const isActive = activeFile?.path === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => { setActiveFile(file); setSidebarOpen(false); }}
                      style={{
                        padding: '9px 16px 9px 20px', cursor: 'pointer',
                        background: isActive ? '#10b98112' : 'transparent',
                        borderLeft: isActive ? '2px solid #10b981' : '2px solid transparent',
                        transition: 'all .12s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#ffffff08'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ fontSize: 13, color: isActive ? tk.textBright : tk.text, fontFamily: tk.sans, lineHeight: 1.35, fontWeight: isActive ? 600 : 400 }}>
                        {file.title}
                      </div>
                      {file.metadata.readTime && (
                        <div style={{ fontSize: 10, color: tk.textDim, fontFamily: tk.mono, marginTop: 3 }}>
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
              zIndex: 50, background: '#111111', border: `1px solid ${tk.border}`,
              borderLeft: 'none', borderRadius: '0 8px 8px 0',
              color: '#10b981', cursor: 'pointer', padding: '14px 7px',
              fontSize: 12, fontFamily: tk.mono, fontWeight: 700,
              boxShadow: '4px 0 16px rgba(0,0,0,0.4)',
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              letterSpacing: 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#10b98122'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#111111'; }}
          >
            ▶ MENU
          </button>
        )}

        {/* ── Main Content ── */}
        <main ref={scrollRef} className="scroll-container library-main" onScroll={handleScroll}>
          <div style={{ display: 'flex', width: '100%' }}>

            {/* Article */}
            <div className="markdown-body library-content">
              {activeFile ? (
                <>
                  {/* File header */}
                  <div style={{ marginBottom: 28, borderBottom: `1px solid ${tk.border}`, paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: tk.textDim, fontFamily: tk.mono }}>{activeFile.metadata.category}</span>
                      {activeFile.metadata.difficulty && (
                        <>
                          <span style={{ color: tk.border }}>·</span>
                          <span style={{ fontSize: 10, color: tk.amber, fontFamily: tk.mono }}>{activeFile.metadata.difficulty}</span>
                        </>
                      )}
                      {activeFile.metadata.readTime && (
                        <>
                          <span style={{ color: tk.border }}>·</span>
                          <span style={{ fontSize: 10, color: tk.textDim, fontFamily: tk.mono }}>⏱ {activeFile.metadata.readTime}</span>
                        </>
                      )}
                    </div>
                    <h1 style={{ margin: '0 0 12px', fontSize: '2.2rem', fontWeight: 900, color: tk.textBright, lineHeight: 1.2 }}>
                      {activeFile.title}
                    </h1>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {activeFile.metadata.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} style={{ fontSize: 10, background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontFamily: tk.mono, border: '1px solid #10b98130' }}>
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
            {toc.length > 0 && (
              <div className="library-toc">
                <div style={{ fontSize: 10, color: tk.textDim, fontFamily: tk.mono, fontWeight: 800, letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' }}>
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
                          background: isActive ? '#10b98112' : 'transparent',
                          border: 'none',
                          borderLeft: `2px solid ${isActive ? '#10b981' : 'transparent'}`,
                          borderRadius: '0 4px 4px 0',
                          padding: `5px 8px 5px ${6 + (item.level - 1) * 10}px`,
                          cursor: 'pointer',
                          fontSize: item.level === 2 ? 12 : 11,
                          color: isActive ? '#10b981' : tk.textDim,
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
                    fontSize: 11, fontFamily: tk.mono, fontWeight: 600,
                    letterSpacing: 0.5, transition: 'all 0.15s',
                    opacity: showBackToTop ? 1 : 0,
                    pointerEvents: showBackToTop ? 'auto' : 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#10b98112'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = '#10b98150'; }}
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
