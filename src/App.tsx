import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MousePointer, Github, CheckCircle2, 
  ArrowRight, Zap, GitBranch, RefreshCw 
} from 'lucide-react';
import { LaserInspector } from './components/LaserInspector';
import { RipDrawer } from './components/RipDrawer';
import { extractDomTree } from './engine/domExtractor';
import { RipNode } from './engine/types';

export default function App() {
  const [inspecting, setInspecting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RipNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 快捷键 Alt + R 开启/关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setInspecting((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelectElement = (el: HTMLElement) => {
    const extracted = extractDomTree(el);
    if (extracted) {
      setSelectedNode(extracted);
      setDrawerOpen(true);
      setInspecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 激光吸附检测器 */}
      <LaserInspector
        active={inspecting}
        onSelect={handleSelectElement}
        onCancel={() => setInspecting(false)}
      />

      {/* 代码抽屉 */}
      <div id="ripui-root">
        <RipDrawer
          node={selectedNode}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {/* 顶部导航 */}
      <header className="h-16 border-b border-white/10 px-8 flex items-center justify-between backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                RipUI
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v0.1.0 Alpha
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AI-era DOM & CSS to React + Tailwind Ripper</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/templates.html"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <span>已有模板库</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200">New</span>
          </a>

          <button
            onClick={() => setInspecting(!inspecting)}
            className={`px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-2 transition-all shadow-lg ${
              inspecting
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{inspecting ? 'Inspecting... (Press ESC to cancel)' : 'Inspect UI (Alt + R)'}</span>
          </button>

          <a
            href="https://github.com/cpttbtptp2812/RipUI"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs"
          >
            <Github className="w-4 h-4" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero 区域 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col gap-12">
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-xs font-mono">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            No Vision Guessing • 100% Pixel Precision
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Rip Any Web Component into{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Clean React + Tailwind
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Screenshot-to-code guesses margins, loses SVGs, and breaks layout.
            <br />
            <strong className="text-slate-200">RipUI</strong> extracts live computed CSS and DOM trees directly from the render engine. Click the button above to test ripping the demo cards below!
          </p>
        </section>

        {/* 演示组件展示区（用户可圈选测试） */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Demo Card 1: Linear Issue Card */}
          <div className="group rounded-2xl bg-[#0f121a]/80 border border-white/10 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md">
                  LIN-4092
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  In Progress
                </span>
              </div>
              <h3 className="font-semibold text-base text-white group-hover:text-cyan-300 transition-colors">
                Implement Real DOM computed CSS to Tailwind converter
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parse element computed styles and map spacing, colors, and typography to semantic Tailwind CSS utility classes.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-6">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-[#0f121a] flex items-center justify-center text-[10px] font-bold text-white">
                  WX
                </div>
                <div className="w-7 h-7 rounded-full bg-cyan-500 border-2 border-[#0f121a] flex items-center justify-center text-[10px] font-bold text-white">
                  AI
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">3 days ago</span>
            </div>
          </div>

          {/* Demo Card 2: Stripe Pricing Plan */}
          <div className="rounded-2xl bg-gradient-to-b from-[#131622] to-[#0d0f17] border border-cyan-500/30 p-6 relative overflow-hidden shadow-xl flex flex-col justify-between cursor-pointer">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg">
              Popular
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Pro Developer</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
              <p className="text-xs text-slate-400">
                Full access to real-time DOM ripper, unlimited exports, and custom Tailwind themes.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Unlimited component ripping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>React, Vue 3 & Clean HTML</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>100% SVG icon extraction</span>
                </li>
              </ul>
            </div>

            <button className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all">
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Demo Card 3: Vercel Deployment Pipeline */}
          <div className="rounded-2xl bg-[#0f121a]/80 border border-white/10 p-6 flex flex-col justify-between hover:border-slate-600 transition-all cursor-pointer">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono text-slate-200">main</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Commit: 2e2fe59</span>
                  <span>1m ago</span>
                </div>
                <p className="text-white truncate">feat: add live DOM ripper engine</p>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="text-slate-200 font-medium">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>Domains:</span>
                  <span className="text-cyan-400 font-mono">ripui.dev</span>
                </div>
              </div>
            </div>

            <button className="mt-6 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Redeploy</span>
            </button>
          </div>
        </section>
      </main>

      {/* 底部版权 */}
      <footer className="h-14 border-t border-white/10 px-8 flex items-center justify-between text-xs text-slate-500 bg-black/20">
        <span>© 2026 RipUI Open Source. Made with ❤️ for developers.</span>
        <div className="flex items-center gap-4">
          <a href="https://github.com/cpttbtptp2812/RipUI" className="hover:text-slate-300 transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
