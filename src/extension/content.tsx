import React from 'react';
import ReactDOM from 'react-dom/client';
import { extractDomTree } from '../engine/domExtractor';
import { LaserInspector } from '../components/LaserInspector';
import { RipDrawer } from '../components/RipDrawer';
import { RipNode } from '../engine/types';
import tailwindStyles from '../index.css?inline';

// 创建与挂载 Shadow DOM 容器
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
    // 监听来自 background 或快捷键的消息
    const handleMessage = (msg: { type: string }) => {
      if (msg.type === 'TOGGLE_RIPUI') {
        setActive((prev) => !prev);
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
      <LaserInspector
        active={active}
        onSelect={handleSelect}
        onCancel={() => setActive(false)}
      />
      <RipDrawer
        node={selectedNode}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

ReactDOM.createRoot(mountPoint).render(<ExtensionApp />);

