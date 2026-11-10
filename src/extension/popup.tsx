import React from 'react';
import ReactDOM from 'react-dom/client';
import { Zap, MousePointer, Github, Keyboard } from 'lucide-react';

function Popup() {
  const triggerInspect = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RIPUI' });
        window.close();
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">RipUI ⚡</span>
            <span className="block text-[10px] text-slate-400">Real DOM Ripper</span>
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
          v0.1.0
        </span>
      </div>

      <button
        onClick={triggerInspect}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
      >
        <MousePointer className="w-3.5 h-3.5" />
        <span>Inspect Element</span>
      </button>

      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Shortcut:</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px] text-cyan-400">
          Alt + R
        </kbd>
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span>Zero hallucination</span>
        <a
          href="https://github.com/cpttbtptp2812/RipUI"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-slate-300 hover:text-white"
        >
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}

const root = document.getElementById('popup-root');
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
}
