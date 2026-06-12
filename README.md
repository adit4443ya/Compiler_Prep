# Compiler Interview Forge v5.0

A comprehensive, self-contained interview preparation app built for a Qualcomm Senior Compiler Engineer interview. Covers compiler theory, C++ internals, GPU/ML stacks, DSA, and ARM/AArch64 backend work — all in a dark-themed interactive React UI.

## What's Inside

### Compiler Interview Guide (29 Modules, 120+ Q&A)

Interactive question/answer panels with difficulty tags (Easy / Med / Hard / Must), organized into topic groups:

| Group | Topics |
|---|---|
| **Compiler Core** | SSA & Phi Nodes, LLVM IR, Pass Manager, Full Pipeline, Instruction Selection, Register Allocation |
| **Optimizations** | Loop & Scalar Opts, Vectorization & SIMD, Dataflow Analysis, Alias Analysis |
| **C++ Deep Dive** | Object Model & OOP, Templates & Metaprogramming, Memory / Move / RAII, Concurrency & Atomics, STL / Storage / ODR |
| **Systems** | Architecture & Cache, ARM / AArch64, Linking & ABI, Testing & Debugging |
| **GPU & ML Stack** | CUDA, Triton, MLIR, PyTorch / torch.compile, Mojo / MAX |
| **HFT Optimizations** | Low-latency systems playbook |
| **Interview** | Resume deep Q&A, 120+ mock questions, full mock simulation, behavioral prep |

### DSA Forge (76 + NVIDIA Problems)

Full solutions with top-down and bottom-up approaches, complexity analysis, and C++ code across 24 pattern categories:

- **DP**: Knapsack, String, Interval/Game, Bitmask, Sequence
- **Graph**: BFS, Topo Sort, Shortest Path, Union Find, MST, Tarjan
- **Other**: Sliding Window, Monotonic Stack, Prefix Sums, Greedy, Two Pointers, Binary Search, Heap, Trees, Backtracking, Linked List, Stack, Trie, System Design DSA
- **NVIDIA-specific**: Verification engineering problems, bug hunt exercises, output quizzes

### Library Source (15 Reference Guides, 7,200+ lines)

Markdown reference documents rendered in-app with a sidebar, table of contents, scroll progress, and search:

| File | Topic | Lines |
|---|---|---|
| `01_ssa_and_dominance.md` | SSA Construction & Destruction, Cytron's Algorithm, MemorySSA | 1,198 |
| `02_optimization_passes.md` | LLVM Optimization Passes Deep Dive | 1,061 |
| `03_llvm_backend_pipeline.md` | Backend Pipeline: ISel → RegAlloc → Scheduling | 809 |
| `04_pass_manager_and_infrastructure.md` | New Pass Manager, Analysis/Transform split | 326 |
| `05_cpp_advanced_guide.md` | Advanced C++: templates, SFINAE, CRTP, move | 710 |
| `06_rtti_and_object_model.md` | RTTI, vtables, multiple inheritance, thunks | 1,066 |
| `07_memory_models_and_concurrency.md` | Memory ordering, acquire-release, atomics | 77 |
| `08_ml_compiler_stacks.md` | torch.compile, Triton, MLIR, TVM | 444 |
| `09_nvidia_verification_engineering.md` | NVIDIA GPU compiler verification | 120 |
| `10_qualcomm_backend_interview.md` | Qualcomm-specific: Hexagon DSP, HVX, Oryon | 76 |
| `11_llvm_tooling_commands.md` | opt, llc, clang flags, FileCheck, TableGen | 594 |
| `12_interview_scenario_playbook.md` | System design & scenario-based Q&A | 95 |
| `13_aarch64_architecture.md` | AArch64 ISA, calling convention, registers | 230 |
| `14_neon_sve_vectorization.md` | NEON/SVE/SVE2 vectorization patterns | 185 |
| `15_aarch64_backend_and_onboarding.md` | ARM LLVM backend onboarding guide | 215 |

## Tech Stack

- **React 19** + **Vite 8**
- `react-markdown` + `remark-gfm` — renders markdown guides in-app
- `react-syntax-highlighter` (Prism / vscDarkPlus) — syntax-highlighted C++/LLVM IR code blocks
- Dark theme (Vercel/Linear-inspired, `#0a0a0a` base)

## Getting Started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Context

Built around the author's background:
- **Merged LLVM upstream PR** — CIR codegen for `__rdtsc` / `__rdtscp` (MLIR-based CIR dialect, triple FileCheck)
- **GSoC 2025 — LFortran** — redesigned `OMPRegion` ASR with 13+ OpenMP constructs and GPU offloading support
- **POT3D MPI** — compiled 20K-line astrophysics Fortran with 30+ MPI wrappers at 0.95× GFortran parity
- **4 publications** (HiPC, EuroMicro PDP, FGCS Elsevier) — MPI vs OpenMP on RISC-V with 3.42× speedup

Target role: **Qualcomm Senior Compiler Engineer** — Hexagon DSP (VLIW/HVX) and Oryon CPU (ARM) compiler stacks.
