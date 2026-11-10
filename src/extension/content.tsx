import React from 'react';
import ReactDOM from 'react-dom/client';
import { extractDomTree } from '../engine/domExtractor';
import { LaserInspector } from '../components/LaserInspector';
import { RipDrawer } from '../components/RipDrawer';
import { RipNode } from '../engine/types';
import tailwindStyles from '../index.css?inline';

// 单例防止多次注入挂载
if (!document.getElementById('ripui-shadow-host')) {
  const hostEl = document.createElement('div');
  hostEl.id = 'ripui-shadow-host';
  document.body.appendChild(hostEl);

  const shadowRoot = hostEl.attachShadow({ mode: 'open' });

  // 注入离线编译的完整 Tailwind 与基础样式至 Shadow DOM
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    ${tailwindStyles}
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    * { box-sizing: border-box; }
  `;
  shadowRoot.appendChild(styleTag);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'ripui-shadow-app';
  shadowRoot.appendChild(mountPoint);

  function ExtensionApp() {
    const [active, setActive] = React.useState(false);
    const [selectedNode, setSelectedNode] = React.useState<RipNode | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    React.useEffect(() => {
      // 监听来自 background 或 popup 的消息
      const handleMessage = (
        msg: { type: string },
        sender: any,
        sendResponse: (res: any) => void
      ) => {
        if (msg.type === 'TOGGLE_RIPUI') {
          setActive((prev) => {
            const next = !prev;
            return next;
          });
          if (sendResponse) sendResponse({ ok: true });
        }
      };

      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(handleMessage);
      }

      // 网页内直接快捷键 Alt + R 也能响应
      const handleKey = (e: KeyboardEvent) => {
        if (e.altKey && (e.key === 'r' || e.key === 'R')) {
          e.preventDefault();
          setActive((prev) => !prev);
        }
      };
      window.addEventListener('keydown', handleKey);

      return () => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
        window.removeEventListener('keydown', handleKey);
      };
    }, []);

    const handleSelect = (el: HTMLElement) => {
      const extracted = extractDomTree(el);
      if (extracted) {
        setSelectedNode(extracted);
        setDrawerOpen(true);
        setActive(false);
      }
    };

    return (
      <>
        {/* 圈选激活顶部提醒浮动胶囊 */}
        {active && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999999] px-4 py-2 rounded-full bg-[#0d1017]/95 border border-cyan-500/40 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-sans animate-bounce">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold text-cyan-300">RipUI 激光圈选已开启</span>
            <span className="text-slate-400">| 悬浮点击任意组件，按 ESC 退出</span>
            <button
              onClick={() => setActive(false)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[11px]"
            >
              退出
            </button>
          </div>
        )}

        <LaserInspector
          active={active}
          onSelect={handleSelect}
          onCancel={() => setActive(false)}
        />
        <RipDrawer
          node={selectedNode}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onStartInspect={() => {
            setDrawerOpen(false);
            setActive(true);
          }}
        />
      </>
    );
  }

  ReactDOM.createRoot(mountPoint).render(<ExtensionApp />);
}
