import React, { useState, useEffect, useRef } from 'react';
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
    const lines = match[1].split('\n');
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        metadata[key] = val;
      }
    });
    cleanContent = content.replace(match[0], '').trim();
  }
  return { metadata, cleanContent };
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
  
  // Sort files by name (01_, 02_, etc) to keep logical ordering
  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
  
  const [activeFile, setActiveFile] = useState(sortedFiles[0] || null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [activeHeader, setActiveHeader] = useState('');

  // Group by category
  const categories = {};
  sortedFiles.forEach(f => {
    const cat = f.metadata.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(f);
  });

  // Extract TOC
  useEffect(() => {
    if (!activeFile) return;
    const headers = [];
    const lines = activeFile.cleanContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        // Skip the very first # title if it matches the document title
        if (match[1] === '#' && match[2].trim() === activeFile.title.trim()) return;
        
        headers.push({
          level: match[1].length,
          text: match[2].replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
          id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        });
      }
    });
    setToc(headers);
    setScrollProgress(0);
    document.querySelector('.scroll-container')?.scrollTo(0, 0);
  }, [activeFile]);

  const handleScroll = (e) => {
    const el = e.target;
    const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    setScrollProgress(progress || 0);

    // Scroll spy
    const headerElements = Array.from(el.querySelectorAll('h1, h2, h3'));
    const scrollPos = el.scrollTop + 100;
    let current = '';
    
    for (let i = headerElements.length - 1; i >= 0; i--) {
      if (headerElements[i].offsetTop <= scrollPos) {
        current = headerElements[i].id;
        break;
      }
    }
    setActiveHeader(current);
  };

  const filteredCategories = {};
  Object.keys(categories).forEach(cat => {
    const filtered = categories[cat].filter(f => 
      f.title.toLowerCase().includes(search.toLowerCase()) || 
      f.metadata.tags.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) filteredCategories[cat] = filtered;
  });

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      {/* Progress Bar */}
      <div style={{ height: 3, width: '100%', background: tk.bg2 }}>
        <div style={{ height: '100%', width: `${scrollProgress}%`, background: '#10b981', transition: 'width 0.1s' }} />
      </div>
      
      <div className="library-layout">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕ CLOSE' : '☰ MENU'}
        </button>
        <div 
          className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} 
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <nav className={`library-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${tk.border}` }}>
            <div style={{ fontFamily: tk.mono, color: "#10b981", fontSize: 11, letterSpacing: ".12em", fontWeight: 800 }}>LIBRARY SOURCE</div>
            
            <input 
              type="text" 
              placeholder="Search files or tags..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', marginTop: 12, marginBottom: 12,
                background: '#000', border: `1px solid ${tk.border}`, borderRadius: 6,
                color: tk.text, fontSize: 13, fontFamily: tk.sans, outline: 'none'
              }}
            />

            {/* Global Toggle */}
            <div style={{display:"flex", background:tk.bg, borderRadius:6, padding:2, border:`1px solid ${tk.border}`}}>
              <div onClick={()=>setMode("compiler")} style={{flex:1, textAlign:"center", padding:"6px 0", fontSize:10, fontFamily:tk.mono, cursor:"pointer", borderRadius:4, background:"transparent", color:tk.textDim, fontWeight:400}}>PREP</div>
              <div onClick={()=>setMode("dsa")} style={{flex:1, textAlign:"center", padding:"6px 0", fontSize:10, fontFamily:tk.mono, cursor:"pointer", borderRadius:4, background:"transparent", color:tk.textDim, fontWeight:400}}>DSA</div>
              <div onClick={()=>setMode("library")} style={{flex:1, textAlign:"center", padding:"6px 0", fontSize:10, fontFamily:tk.mono, cursor:"pointer", borderRadius:4, background:"#10b98122", color:"#10b981", fontWeight:800}}>LIBRARY</div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: "12px 0" }}>
            {Object.keys(filteredCategories).map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ padding: "0 16px", fontSize: 11, color: tk.textDim, fontFamily: tk.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  {cat}
                </div>
                {filteredCategories[cat].map(file => (
                  <div key={file.path} onClick={() => { setActiveFile(file); setSidebarOpen(false); }}
                    style={{
                      padding: "8px 16px 8px 24px", cursor: "pointer",
                      background: activeFile?.path === file.path ? "#10b98112" : "transparent",
                      borderLeft: activeFile?.path === file.path ? `2px solid #10b981` : "2px solid transparent",
                      transition: "all .12s"
                    }}>
                    <div style={{ fontSize: 13, color: activeFile?.path === file.path ? tk.textBright : tk.text, fontFamily: tk.sans, lineHeight: 1.3, fontWeight: activeFile?.path === file.path ? 600 : 400 }}>
                      {file.title}
                    </div>
                    {file.metadata.readTime && (
                      <div style={{ fontSize: 10, color: tk.textDim, fontFamily: tk.mono, marginTop: 4 }}>
                        ⏱ {file.metadata.readTime} • {file.metadata.difficulty}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="scroll-container library-main" onScroll={handleScroll}>
          <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto' }}>
            <div className="markdown-body library-content">
              {activeFile ? (
                <>
                  <div style={{ marginBottom: 30, borderBottom: `1px solid ${tk.border}`, paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {activeFile.metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                        <span key={tag} style={{ fontSize: 10, background: '#10b98122', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontFamily: tk.mono }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h1 style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, color: tk.textBright, lineHeight: 1.2 }}>{activeFile.title}</h1>
                  </div>
                  
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <div style={{ margin: '24px 0', borderRadius: 10, overflow: 'hidden', border: `1px solid ${tk.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                            <div style={{ background: '#111111', borderBottom: `1px solid ${tk.border}`, padding: '8px 16px', fontSize: 11, color: tk.textDim, fontFamily: tk.mono, letterSpacing: .5, display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: 8, color: '#10b981' }}>■</span> {match[1].toUpperCase()}
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
                          <code {...props} className={className} style={{ background: '#111111', padding: '3px 6px', borderRadius: 4, color: tk.cyan, fontFamily: tk.mono, fontSize: '0.9em' }}>
                            {children}
                          </code>
                        )
                      },
                      h1: ({node, ...props}) => {
                        const id = props.children[0]?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        return <h1 id={id} {...props} />
                      },
                      h2: ({node, ...props}) => {
                        const id = props.children[0]?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        return <h2 id={id} {...props} />
                      },
                      h3: ({node, ...props}) => {
                        const id = props.children[0]?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        return <h3 id={id} {...props} />
                      },
                      blockquote: ({node, children, ...props}) => {
                        const childrenArray = React.Children.toArray(children);
                        const firstChild = childrenArray[0];
                        
                        if (React.isValidElement(firstChild) && firstChild.type === 'p') {
                          const pChildren = React.Children.toArray(firstChild.props.children);
                          const firstText = typeof pChildren[0] === 'string' ? pChildren[0] : '';
                          const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
                          
                          if (match) {
                            const type = match[1].toLowerCase();
                            const newPChildren = [...pChildren];
                            newPChildren[0] = firstText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, '');
                            
                            return (
                              <blockquote className={`gh-alert gh-alert-${type}`} {...props}>
                                <div className="gh-alert-title">{type.toUpperCase()}</div>
                                <p>{newPChildren}</p>
                                {childrenArray.slice(1)}
                              </blockquote>
                            );
                          }
                        }
                        return <blockquote {...props}>{children}</blockquote>;
                      }
                    }}
                  >
                    {activeFile.cleanContent}
                  </ReactMarkdown>
                </>
              ) : (
                <div style={{ color: tk.textDim, fontFamily: tk.mono, padding: 40, textAlign: 'center' }}>No markdown files found.</div>
              )}
            </div>

            {/* Right TOC Panel */}
            {toc.length > 0 && (
              <div className="library-toc">
                <div style={{ fontSize: 11, color: tk.textDim, fontFamily: tk.mono, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>ON THIS PAGE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {toc.map((item, idx) => (
                    <a 
                      key={idx} 
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ 
                        fontSize: 12, 
                        color: activeHeader === item.id ? '#10b981' : tk.textDim, 
                        fontFamily: tk.sans, 
                        textDecoration: 'none',
                        paddingLeft: (item.level - 1) * 12,
                        lineHeight: 1.4,
                        transition: 'color 0.2s',
                        fontWeight: activeHeader === item.id ? 600 : 400
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
