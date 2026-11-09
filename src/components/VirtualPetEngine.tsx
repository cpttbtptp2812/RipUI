import React, { useState, useEffect, useRef } from 'react';
import catIdle from '../assets/cat/cat_idle.png';
import catIdleBlink from '../assets/cat/cat_idle_blink.png';
import catSideEye from '../assets/cat/cat_side_eye.png';
import catDisdain from '../assets/cat/cat_disdain.png';
import catStare from '../assets/cat/cat_stare.png';
import catYawn from '../assets/cat/cat_yawn.png';
import catTailLayer from '../assets/cat/cat_tail_layer.png';

export type PetBehavior = 
  | 'idle_loaf'     // 趴着打盹
  | 'idle_blink'    // 傲娇眨眼
  | 'yawn'          // 打大哈欠
  | 'walk'          // 慢悠悠踱步走动
  | 'stretch'       // 伸大懒腰
  | 'scratch'       // 磨爪子抓抓
  | 'laser_hunt'    // 追捕激光笔红点
  | 'eat_fish'      // 吧唧吧唧啃小鱼干
  | 'watch_ai'      // 盯紧 AI 吐字
  | 'panic_slam'    // 暴躁拍桌拉闸
  | 'held_air';     // 被鼠标提起来悬空

interface VirtualPetEngineProps {
  stats: {
    todayCostUSD: number;
    todayTokens: number;
    currentSpeed: number;
    activeClient: string;
    model: string;
    lastAction: string;
  };
  isBreakerTripped: boolean;
  soundEnabled: boolean;
  onToggleBreaker: () => void;
}

export const VirtualPetEngine: React.FC<VirtualPetEngineProps> = ({
  stats,
  isBreakerTripped,
  soundEnabled,
  onToggleBreaker,
}) => {
  // 当前自主行为
  const [behavior, setBehavior] = useState<PetBehavior>('idle_loaf');
  // 坐标位置（支持在桌面底座上左右自由走动）
  const [posX, setPosX] = useState(0); // 范围 -140 ~ +140
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [bubble, setBubble] = useState<string>("你花你的钱，我打我的盹。");
  
  // 道具系统
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [fishCount, setFishCount] = useState(3);
  const [hasFishOnFloor, setHasFishOnFloor] = useState(false);
  const [scratchMarks, setScratchMarks] = useState<number[]>([]);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  // 动画状态
  const [tailAngle, setTailAngle] = useState(0);
  const [walkStep, setWalkStep] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Web Audio 丰富实体拟音合成器（无外部 mp3 依赖）
  const playSfx = (type: 'purr' | 'crunch' | 'scratch' | 'pounce' | 'laser' | 'yawn' | 'alarm') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;

      if (type === 'purr') {
        // 低频呼噜
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'crunch') {
        // 啃小鱼干脆响
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450 + i * 120, now + i * 0.08);
          gain.gain.setValueAtTime(0.08, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.06);
        }
      } else if (type === 'scratch') {
        // 磨爪杂音
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'alarm') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.setValueAtTime(240, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // ignore
    }
  };

  // 2. 尾巴骨骼正弦摆动物理循环
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.05;
      const speedMult = behavior === 'panic_slam' ? 4 : behavior === 'walk' ? 2 : 1;
      const angle = Math.sin(t * speedMult) * (behavior === 'panic_slam' ? 12 : 5);
      setTailAngle(angle);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [behavior]);

  // 3. 漫步走动循环物理 (WALKING 步进位移)
  useEffect(() => {
    if (behavior !== 'walk') return;
    const interval = setInterval(() => {
      setWalkStep(prev => (prev + 1) % 4);
      setPosX(prev => {
        const delta = facing === 'right' ? 6 : -6;
        const next = prev + delta;
        // 到边缘自动转身
        if (next > 130) {
          setFacing('left');
          return 130;
        } else if (next < -130) {
          setFacing('right');
          return -130;
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [behavior, facing]);

  // 4. 自主行为思考树 (Autonomous Behavior Engine)
  useEffect(() => {
    if (isLaserActive || hasFishOnFloor || isBreakerTripped || isBeingDragged) return;

    const autonomousTimer = setInterval(() => {
      // 当 AI 正在高速生成时，强制锁定为【监视写代码】
      if (stats.currentSpeed > 50) {
        setBehavior('watch_ai');
        setBubble("键盘敲得起飞，算力不要钱啊？");
        return;
      }

      // 自主随机动作决策
      const rand = Math.random();
      if (rand < 0.35) {
        // 打盹
        setBehavior('idle_loaf');
        setBubble("你花你的钱，我打我的盹。");
      } else if (rand < 0.55) {
        // 起身漫步巡逻
        setBehavior('walk');
        setBubble("巡逻一下，看看今天谁又在写 bug。");
        setTimeout(() => {
          setBehavior('idle_loaf');
        }, 5000);
      } else if (rand < 0.70) {
        // 伸个大懒腰
        setBehavior('stretch');
        setBubble("嗷呜……伸个大懒腰。");
        setTimeout(() => setBehavior('idle_loaf'), 3200);
      } else if (rand < 0.85) {
        // 打大哈欠
        setBehavior('yawn');
        playSfx('yawn');
        setBubble("哈~~~~欠，慢死了。");
        setTimeout(() => setBehavior('idle_loaf'), 3000);
      } else {
        // 磨爪子
        setBehavior('scratch');
        playSfx('scratch');
        setScratchMarks(prev => [...prev.slice(-3), posX]);
        setBubble("磨磨爪子，待会准备拉闸。");
        setTimeout(() => setBehavior('idle_loaf'), 3500);
      }
    }, 8000);

    return () => clearInterval(autonomousTimer);
  }, [isLaserActive, hasFishOnFloor, isBreakerTripped, stats.currentSpeed, posX, isBeingDragged]);

  // 道具触发：投喂小鱼干
  const handleFeedFish = () => {
    if (fishCount <= 0) {
      setBubble("没鱼干了，多跑几行代码赚点钱去。");
      return;
    }
    setFishCount(prev => prev - 1);
    setHasFishOnFloor(true);
    setBubble("嗅嗅……有鱼的味道？老子尝尝。");

    setTimeout(() => {
      setBehavior('eat_fish');
      playSfx('crunch');
      setBubble("吧唧吧唧……算你识相。");

      setTimeout(() => {
        setHasFishOnFloor(false);
        setBehavior('idle_loaf');
        setBubble("吃饱了，继续打盹，别打扰我。");
      }, 3500);
    }, 800);
  };

  // 道具触发：激光笔逗猫
  const handleToggleLaser = () => {
    const next = !isLaserActive;
    setIsLaserActive(next);
    if (next) {
      setBehavior('laser_hunt');
      setBubble("那个红点是什么东西？！盯——");
    } else {
      setBehavior('idle_loaf');
      setBubble("哼，幼稚的人类玩具。");
    }
  };

  // 激光笔在舞台内移动
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top;
    setLaserPos({ x, y });

    if (isLaserActive) {
      // 猫咪视线与位置朝向跟随红点
      if (x > posX + 20) setFacing('right');
      else if (x < posX - 20) setFacing('left');
    }
  };

  // 激光扑击 (点击激光红点扑咬)
  const handleLaserPounce = () => {
    if (!isLaserActive) return;
    playSfx('purr');
    // 猛扑跳跃位移
    setPosX(laserPos.x);
    setBubble("抓到了！老子果然百发百中。");
    setTimeout(() => {
      if (isLaserActive) {
        setBubble("可恶，居然抓不到光斑……");
      }
    }, 1200);
  };

  // 拖拽猫咪
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsBeingDragged(true);
    setBehavior('held_air');
    setBubble("快把老子放下来！成何体统？！");
  };

  const handleMouseUp = () => {
    if (isBeingDragged) {
      setIsBeingDragged(false);
      setBehavior('idle_loaf');
      setBubble("终于落地了，下次再乱拎老子抓你。");
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex flex-col items-center select-none"
      style={{ width: '420px', height: '320px' }}
    >
      {/* 厌世嘲讽气泡 */}
      <div 
        className="absolute top-2 z-50 bg-zinc-900/95 text-zinc-100 text-xs px-3.5 py-1.5 rounded-xl border border-zinc-700/80 shadow-2xl backdrop-blur-md max-w-[280px] pointer-events-none transition-all flex items-center space-x-2 animate-fade-in"
        style={{
          transform: `translateX(${posX * 0.4}px)`
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="truncate">{bubble}</span>
        <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-zinc-900/95 border-r border-b border-zinc-700/80 rotate-45" />
      </div>

      {/* 激光笔投射点 */}
      {isLaserActive && (
        <div 
          onClick={handleLaserPounce}
          className="absolute z-40 w-4 h-4 -ml-2 -mt-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/80 cursor-crosshair animate-pulse"
          style={{
            left: `calc(50% + ${laserPos.x}px)`,
            top: `${laserPos.y}px`,
          }}
          title="点击让猫咪猛扑捕获激光！"
        >
          <div className="absolute inset-0 rounded-full border-2 border-rose-300 animate-ping" />
        </div>
      )}

      {/* 地面掉落的小鱼干 */}
      {hasFishOnFloor && (
        <div 
          className="absolute z-30 bottom-16 left-1/2 -translate-x-1/2 animate-bounce flex items-center space-x-1 bg-amber-400/90 text-zinc-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg"
        >
          <span>🐟 喷香小鱼干</span>
        </div>
      )}

      {/* 地面磨爪划痕 */}
      {scratchMarks.map((x, idx) => (
        <div 
          key={idx}
          className="absolute bottom-14 font-mono text-zinc-600 font-black text-xs tracking-widest opacity-60 pointer-events-none"
          style={{ left: `calc(50% + ${x}px)` }}
        >
          ///
        </div>
      ))}

      {/* ================= 核心桌宠活动舞台 ================= */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute bottom-14 cursor-grab active:cursor-grabbing transition-transform duration-200"
        style={{
          transform: `translateX(${posX}px) scaleX(${facing === 'left' ? -1 : 1}) ${
            behavior === 'walk' ? `translateY(${walkStep % 2 === 0 ? '-3px' : '0px'})` : ''
          } ${behavior === 'stretch' ? 'scaleX(1.15) scaleY(0.92)' : ''} ${
            behavior === 'held_air' ? 'translateY(-24px) rotate(4deg)' : ''
          }`,
          transformOrigin: 'bottom center'
        }}
      >
        <div className="w-[280px] h-[180px] relative">
          {/* 1. 待机打盹 / 慢走形态 */}
          {(behavior === 'idle_loaf' || behavior === 'walk' || behavior === 'laser_hunt' || behavior === 'eat_fish') && (
            <div className={`relative w-full h-full ${behavior === 'idle_loaf' ? 'cat-breathing' : ''}`}>
              <img 
                src={catIdle} 
                alt="黑猫桌宠" 
                className="w-full h-full object-contain pointer-events-none drop-shadow-md"
              />
              {/* 独立正弦摆尾骨骼 */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  transformOrigin: '61% 83%',
                  transform: `rotate(${tailAngle}deg)`,
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <img src={catTailLayer} alt="摆尾" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* 2. 伸懒腰 / 磨爪子形态 */}
          {(behavior === 'stretch' || behavior === 'scratch') && (
            <div className="relative w-full h-full animate-pulse">
              <img src={catDisdain} alt="伸懒腰/抓挠" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          )}

          {/* 3. 打大哈欠 */}
          {behavior === 'yawn' && (
            <img src={catYawn} alt="大打哈欠" className="w-full h-full object-contain drop-shadow-lg" />
          )}

          {/* 4. 监视 AI 写代码 */}
          {behavior === 'watch_ai' && (
            <img src={catSideEye} alt="昂头监视" className="w-full h-full object-contain drop-shadow-lg cat-gentle-hover" />
          )}

          {/* 5. 暴怒拍桌 / 悬空 / 熔断 */}
          {(behavior === 'panic_slam' || behavior === 'held_air' || isBreakerTripped) && (
            <img src={catStare} alt="正面死鱼眼怒瞪" className="w-full h-full object-contain drop-shadow-lg" />
          )}
        </div>
      </div>

      {/* 虚拟桌面底座接触阴影 */}
      <div 
        className="absolute bottom-13 w-56 h-3 bg-black/35 rounded-full blur-md pointer-events-none transition-all duration-200"
        style={{
          transform: `translateX(${posX}px)`
        }}
      />

      {/* ================= 虚拟桌宠互动道具箱 (Toolbox Dock) ================= */}
      <div className="absolute bottom-1 z-30 flex items-center space-x-1.5 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-zinc-800/80 shadow-2xl text-zinc-300 text-xs">
        {/* 投喂小鱼干 */}
        <button
          onClick={handleFeedFish}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-amber-950/60 hover:text-amber-400 border border-zinc-800 transition active:scale-95"
          title="给猫猫投喂小鱼干"
        >
          <span>🐟 投喂</span>
          <span className="text-[10px] font-mono text-amber-400 font-bold">({fishCount})</span>
        </button>

        {/* 激光笔逗猫 */}
        <button
          onClick={handleToggleLaser}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl border transition active:scale-95 ${
            isLaserActive 
              ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-md shadow-rose-900/40 animate-pulse' 
              : 'bg-zinc-900 text-zinc-300 hover:text-rose-400 border-zinc-800'
          }`}
          title="开关红外逗猫激光笔"
        >
          <span>🔴 激光</span>
        </button>

        {/* 慢走漫游 */}
        <button
          onClick={() => {
            setBehavior('walk');
            setBubble("起来巡逻巡逻，看看你写的代码。");
          }}
          className="px-2 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95"
          title="让黑猫在桌面上踱步巡逻"
        >
          <span>🐾 踱步</span>
        </button>

        {/* 伸懒腰 */}
        <button
          onClick={() => {
            setBehavior('stretch');
            setBubble("嗷呜……舒舒服服伸个大懒腰。");
            setTimeout(() => setBehavior('idle_loaf'), 3000);
          }}
          className="px-2 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95"
          title="伸个大懒腰"
        >
          <span>🥱 懒腰</span>
        </button>

        {/* 磨爪子 */}
        <button
          onClick={() => {
            setBehavior('scratch');
            playSfx('scratch');
            setScratchMarks(prev => [...prev.slice(-3), posX]);
            setBubble("磨爪子中，刺啦刺啦……");
            setTimeout(() => setBehavior('idle_loaf'), 3200);
          }}
          className="px-2 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95"
          title="在桌面边缘磨爪子"
        >
          <span>💅 磨爪</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-800 mx-0.5" />

        {/* 暴躁拍桌拉闸 */}
        <button
          onClick={onToggleBreaker}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-semibold transition active:scale-95 ${
            isBreakerTripped
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
              : 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/80 border border-rose-800/60'
          }`}
          title="拍桌熔断死循环"
        >
          <span>🛑 {isBreakerTripped ? '已拉闸' : '拍桌拉闸'}</span>
        </button>
      </div>
    </div>
  );
};

