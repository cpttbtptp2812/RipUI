import React, { useState, useEffect, useRef } from 'react';
import catIdle from '../assets/cat/cat_idle.png';
import catIdleBlink from '../assets/cat/cat_idle_blink.png';
import catSideEye from '../assets/cat/cat_side_eye.png';
import catDisdain from '../assets/cat/cat_disdain.png';
import catStare from '../assets/cat/cat_stare.png';
import catYawn from '../assets/cat/cat_yawn.png';
import catTailLayer from '../assets/cat/cat_tail_layer.png';
import catBodyLayer from '../assets/cat/cat_body_layer.png';

export type CatState = 'idle' | 'streaming' | 'expensive' | 'alert' | 'yawn';

interface GrumpyCatPetProps {
  state: CatState;
  onPoke?: () => void;
  bubbleText?: string;
  isBreakerTripped?: boolean;
}

export const GrumpyCatPet: React.FC<GrumpyCatPetProps> = ({
  state,
  onPoke,
  bubbleText,
  isBreakerTripped = false
}) => {
  // 眨眼状态（用于 idle 模式下的自然慢眨眼）
  const [isBlinking, setIsBlinking] = useState(false);
  // 鼠标微跟随角度（颈部微倾斜）
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  // 被戳时的弹跳动效
  const [isPoked, setIsPoked] = useState(false);
  // 尾巴拍打角度
  const [tailAngle, setTailAngle] = useState(0);

  // 1. 自然慢速眨眼循环 (4~7 秒随机一次厌世闭目)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 3500 + 3500;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 280); // 慢眨眼闭合时长
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 2. 尾巴骨骼正弦摆动物理循环
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      // 尾巴慵懒微摆：平滑正弦摆动 + 偶尔轻拍桌面脉冲
      const baseWiggle = Math.sin(t) * 4.5;
      const thump = Math.sin(t * 0.4) > 0.8 ? Math.sin(t * 2) * 3 : 0;
      setTailAngle(baseWiggle + thump);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // 3. 鼠标微倾斜感知 (Live2D 颈部倾角微跟随)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    // 限制最大旋转 3 度（保持傲娇冷漠，不献媚）
    setMouseOffset({
      x: Math.max(-1, Math.min(1, dx)) * 2.5,
      y: Math.max(-1, Math.min(1, dy)) * 2.0
    });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setIsPoked(true);
    setTimeout(() => setIsPoked(false), 350);
    if (onPoke) onPoke();
  };

  // 根据当前 AI 监控状态确定主贴图模式
  const isIdle = state === 'idle' && !isBreakerTripped;

  return (
    <div
      className="relative cursor-pointer select-none group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title="点击戳戳黑猫"
      style={{
        width: '320px',
        height: '210px',
      }}
    >
      {/* 厌世嘲讽气泡 */}
      {bubbleText && (
        <div 
          className="absolute -top-11 left-6 z-40 bg-zinc-900/90 text-zinc-100 text-[11px] font-sans px-3 py-1.5 rounded-xl shadow-lg border border-zinc-700/80 backdrop-blur-md max-w-[260px] animate-fade-in pointer-events-none transition-all flex items-center space-x-1.5"
          style={{
            transform: `translate(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px)`
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="truncate">{bubbleText}</span>
          {/* 小气泡尖角 */}
          <div className="absolute -bottom-1.5 left-7 w-3 h-3 bg-zinc-900/90 border-r border-b border-zinc-700/80 rotate-45" />
        </div>
      )}

      {/* 骨骼容器：挂载阻尼呼吸、弹跳与角度 */}
      <div
        className={`w-full h-full relative transition-transform duration-300 ${
          isPoked ? 'scale-95 translate-y-1' : ''
        }`}
        style={{
          transform: `rotate(${mouseOffset.x * 0.8}deg) translate(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px)`,
          transformOrigin: 'bottom center'
        }}
      >
        {isIdle ? (
          // ==================== 骨骼分层状态 (IDLE 打盹模式) ====================
          <div className="relative w-full h-full cat-breathing">
            {/* 1. 身体底图（胸腹深沉呼吸起伏） */}
            <img
              src={isBlinking ? catIdleBlink : catIdle}
              alt="厌世打盹黑猫"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md transition-opacity duration-150"
            />

            {/* 2. 独立物理尾巴层（在身体之上正弦波摆动、偶尔拍打桌面） */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transformOrigin: '61% 83%', // 尾骨根部锚点
                transform: `rotate(${tailAngle}deg)`,
                transition: 'transform 0.08s ease-out'
              }}
            >
              <img
                src={catTailLayer}
                alt="摆尾骨骼层"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : (
          // ==================== 关键姿态状态机 (切换姿态) ====================
          <div className="relative w-full h-full flex items-center justify-center">
            {state === 'streaming' && (
              <img
                src={catSideEye}
                alt="坐起斜视"
                className="w-full h-full object-contain drop-shadow-lg cat-gentle-hover"
              />
            )}
            {state === 'expensive' && (
              <img
                src={catDisdain}
                alt="嘴角微张鄙视"
                className="w-full h-full object-contain drop-shadow-lg animate-pulse"
              />
            )}
            {(state === 'alert' || isBreakerTripped) && (
              <img
                src={catStare}
                alt="正面死鱼眼瞪视"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            )}
            {state === 'yawn' && (
              <img
                src={catYawn}
                alt="大打哈欠"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            )}
          </div>
        )}
      </div>

      {/* 底部微弱接触阴影 */}
      <div className="absolute -bottom-1 left-8 right-8 h-3 bg-black/25 rounded-full blur-sm pointer-events-none -z-10" />
    </div>
  );
};

