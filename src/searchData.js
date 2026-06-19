// ════════════════════════════════════════════════════════════════════
//  Global search index — pure client-side, built once at module load.
//  Sources: Library guides (titles + section headers), DSA problems
//  (titles + patterns), and Prep Q&A questions (parsed from App source).
//  Consumed by the ⌘K search overlay in App.jsx.
// ════════════════════════════════════════════════════════════════════
import appSrc from './App.jsx?raw';
import { PROBLEMS, NVIDIA_PROBLEMS } from './dsaData';

const headingId = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const stripMd = (s) =>
  s.replace(/<[^>]+>/g, '')
   .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
   .replace(/`([^`]+)`/g, '$1')
   .replace(/\*\*?([^*]+)\*\*?/g, '$1')
   .trim();

// ── Library: titles + section headers ──────────────────────────────
const mdModules = import.meta.glob('./source/*.md', { query: '?raw', import: 'default', eager: true });

export const LIBRARY_INDEX = Object.keys(mdModules).sort().map((path) => {
  const name = path.split('/').pop().replace('.md', '');
  const num = name.slice(0, 2);
  const raw = mdModules[path];
  const content = raw.replace(/<!--[\s\S]*?-->/, '').trim();
  const titleMatch = content.match(/^#\s+(.*)/m);
  const title = titleMatch ? stripMd(titleMatch[1]) : name;
  const headings = [];
  content.split('\n').forEach((line) => {
    const m = line.match(/^(#{1,3})\s+(.*)$/);
    if (!m) return;
    const text = stripMd(m[2]);
    if (!text || text === title) return;
    headings.push({ text, id: headingId(text) });
  });
  return { num, name, title, headings };
});

// ── DSA: problem titles + patterns + sections ──────────────────────
export const DSA_INDEX = [...PROBLEMS, ...NVIDIA_PROBLEMS].map((p) => ({
  id: p.id,
  title: p.title,
  pattern: p.pattern,
  section: p.section,
  difficulty: p.difficulty,
}));

// ── Prep: Q&A questions parsed out of App.jsx, mapped to their module ──
// Module render-fns look like `\nssa:()=>(` at column 0 of the content object.
const buildPrepIndex = () => {
  const moduleRe = /\n([a-z0-9_]+):\(\)=>/g;
  const mods = [];
  let mm;
  while ((mm = moduleRe.exec(appSrc)) !== null) {
    mods.push({ id: mm[1], offset: mm.index });
  }
  const moduleAt = (offset) => {
    let cur = null;
    for (const m of mods) {
      if (m.offset <= offset) cur = m.id; else break;
    }
    return cur;
  };
  const out = [];
  const seen = new Set();
  const qRe = /<Q\s+[\s\S]*?\sq=(?:"((?:[^"\\]|\\.)*)"|\{"((?:[^"\\]|\\.)*)"\})/g;
  let qm;
  while ((qm = qRe.exec(appSrc)) !== null) {
    const question = (qm[1] || qm[2] || '').replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
    const module = moduleAt(qm.index);
    if (!question || !module) continue;
    const key = module + '|' + question;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ module, question });
  }
  return out;
};

export const PREP_INDEX = buildPrepIndex();

// Human-readable labels for Prep module ids (for result subtitles).
export const PREP_MODULE_LABELS = {
  assess: 'Start Here & Battle Plan', ssa: 'SSA & Phi Nodes', llvm: 'LLVM IR Deep Dive',
  passes: 'Pass Manager & Passes', pipeline: 'Full Pipeline', isel: 'Instruction Selection',
  regalloc: 'Register Allocation', opts: 'Loop & Scalar Opts', vec: 'Vectorization & SIMD',
  dataflow: 'Dataflow Analysis', alias: 'Alias Analysis', cpp_obj: 'Object Model & OOP',
  cpp_tpl: 'Templates & Metaprog', cpp_mem: 'Memory, Move & RAII', cpp_con: 'Concurrency & Atomics',
  cpp_misc: 'STL, Storage & ODR', arch: 'Architecture & Cache', arm: 'ARM / AArch64',
  link: 'Linking & ABI', test: 'Testing & Debugging', cuda: 'CUDA & GPU Model',
  triton: 'Triton & Block Model', mlir: 'MLIR & AI Workloads', pytorch: 'PyTorch & torch.compile',
  mojo: 'Mojo & MAX Platform', hft: 'HFT Playbook & Ops', resume: 'Present Your Background',
  mock: 'Mock Questions', fullmock: 'Full Mock Interview', behav: 'Behavioral Prep',
};
