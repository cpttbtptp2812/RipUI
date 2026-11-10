import React, { useEffect, useState } from 'react';

interface LaserInspectorProps {
  active: boolean;
  onSelect: (el: HTMLElement) => void;
  onCancel: () => void;
}

export const LaserInspector: React.FC<LaserInspectorProps> = ({ active, onSelect, onCancel }) => {
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [tagInfo, setTagInfo] = useState('');

  useEffect(() => {
    if (!active) {
      setHoverRect(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 避免检测到我们自己的抽屉和浮层
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!target || target.closest('#ripui-root') || target.closest('.ripui-ignore')) {
        return;
      }

      const rect = target.getBoundingClientRect();
      setHoverRect(rect);

      const tag = target.tagName.toLowerCase();
      const firstClass = target.classList[0] ? `.${target.classList[0]}` : '';
      setTagInfo(`${tag}${firstClass}  ${Math.round(rect.width)}×${Math.round(rect.height)}`);
    };

    const handleClick = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!target || target.closest('#ripui-root') || target.closest('.ripui-ignore')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      onSelect(target);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onSelect, onCancel]);

  if (!active || !hoverRect) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999990] overflow-hidden ripui-ignore">
      {/* 激光边框 */}
      <div
        className="absolute border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded transition-all duration-75"
        style={{
          top: `${hoverRect.top}px`,
          left: `${hoverRect.left}px`,
          width: `${hoverRect.width}px`,
          height: `${hoverRect.height}px`,
        }}
      >
        {/* 标签徽标 */}
        <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold shadow-md whitespace-nowrap">
          {tagInfo}
        </div>
      </div>
    </div>
  );
};
