import React, { useState, useEffect } from 'react';
import { ThreeCatPet } from './components/ThreeCatPet';
import { VirtualPetEngine } from './components/VirtualPetEngine';
import { 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  PowerOff,
  Layers
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBreakerTripped, setIsBreakerTripped] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [simDesktopBg, setSimDesktopBg] = useState(false);
  const [bubbleText, setBubbleText] = useState("你花你的钱，我打我的盹。");

  // 监控数据
  const [stats, setStats] = useState({
    todayCostUSD: 0.0264,
    todayTokens: 4820,
    currentSpeed: 78,
    activeClient: 'Cursor Composer',
    model: 'claude-3-7-sonnet',
    lastAction: 'AST_PATCH: src/App.tsx',
    riskLevel: 'SAFE'
  });

  const toggleCircuitBreaker = () => {
    const next = !isBreakerTripped;
    setIsBreakerTripped(next);
    if (next) {
      setBubbleText("已拉闸！差不多得了，给老子停下。");
    } else {
      setBubbleText("已合闸，这次省着点花。");
    }
  };

  // 动态模拟 Token 速率随时间波动
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isBreakerTripped) {
        const speeds = [0, 0, 48, 86, 120, 0, 72];
        const nextSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        setStats(prev => {
          const addedTokens = nextSpeed > 0 ? Math.floor(nextSpeed * 1.5) : 0;
          const addedUSD = addedTokens * 0.000003;
          return {
            ...prev,
            currentSpeed: nextSpeed,
            todayTokens: prev.todayTokens + addedTokens,
            todayCostUSD: prev.todayCostUSD + addedUSD
          };
        });

        if (nextSpeed > 60 && viewMode === '3d') {
          setBubbleText("键盘敲得起飞，算力不要钱啊？");
        }
      }
    }, 3200);
    return () => clearInterval(timer);
  }, [isBreakerTripped, viewMode]);

  const costRMB = (stats.todayCostUSD * 7.23).toFixed(2);

  return (
    <div 
      className={`min-h-screen w-screen flex flex-col items-center justify-center relative select-none transition-colors duration-500 overflow-hidden ${
        simDesktopBg 
          ? 'bg-gradient-to-br from-slate-950 via-zinc-900 to-stone-950 text-zinc-100' 
          : 'bg-transparent text-zinc-100'
      }`}
    >
      {/* 桌面小插件主体容器（紧凑轻盈，尺寸小巧） */}
      <div className="relative flex flex-col items-center z-20">
        
        {/* ================= 模式 1: 小巧灵动 3D 活体黑猫 ================= */}
        {viewMode === '3d' ? (
          <ThreeCatPet
            bubbleText={bubbleText}
            isBreakerTripped={isBreakerTripped}
          />
        ) : (
          /* ================= 模式 2: 2D 贴画桌宠 ================= */
          <VirtualPetEngine
            stats={stats}
            isBreakerTripped={isBreakerTripped}
            soundEnabled={soundEnabled}
            onToggleBreaker={toggleCircuitBreaker}
          />
        )}

        {/* ================= 紧凑小巧的冷淡算账 HUD 胶囊（仅 290px 宽） ================= */}
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-2 shadow-2xl shadow-black/80 flex flex-col w-[290px] text-zinc-200 transition-all hover:border-zinc-700">
          
          {/* 上排：小鱼干开销跳表 + 功能按钮 */}
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
            {/* 今日小鱼干支出 */}
            <div className="flex items-baseline space-x-1.5">
              <span className="text-[10px] uppercase font-mono text-zinc-400">🐟 罐头</span>
              <span className="text-sm font-black font-mono tracking-tight text-amber-400">
                ¥{costRMB}
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                (${stats.todayCostUSD.toFixed(3)})
              </span>
            </div>

            {/* 紧凑工具按钮 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 transition"
                title="切换 3D / 2D"
              >
                {viewMode === '3d' ? '3D' : '2D'}
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 rounded text-xs transition ${
                  soundEnabled ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-500'
                }`}
                title={soundEnabled ? '音效开' : '静音'}
              >
                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>

              <button
                onClick={toggleCircuitBreaker}
                className={`flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  isBreakerTripped
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-rose-950/60 hover:text-rose-400 border border-zinc-700/60'
                }`}
              >
                <PowerOff className="w-2.5 h-2.5" />
                <span>{isBreakerTripped ? '已拉闸' : '拉闸'}</span>
              </button>
            </div>
          </div>

          {/* 下排：流速 + 当前动作 */}
          <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <div className="flex items-center space-x-1.5 truncate max-w-[210px]">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isBreakerTripped 
                  ? 'bg-rose-500' 
                  : stats.currentSpeed > 0 
                  ? 'bg-amber-400 animate-ping' 
                  : 'bg-emerald-400'
              }`} />
              <span className="text-zinc-300 font-semibold truncate">{stats.activeClient}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-emerald-400 font-mono">{stats.currentSpeed} t/s</span>
            </div>

            <button
              onClick={() => setShowDetailDrawer(!showDetailDrawer)}
              className="text-zinc-500 hover:text-zinc-200 transition text-[9px] flex items-center space-x-0.5"
            >
              <span>{showDetailDrawer ? '收起' : '详情'}</span>
              {showDetailDrawer ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          </div>

          {/* 当前动作 */}
          <div className="mt-1 text-[9px] font-mono text-zinc-500 truncate flex items-center space-x-1">
            <Terminal className="w-2.5 h-2.5 text-zinc-400" />
            <span className="truncate">{stats.lastAction}</span>
          </div>

          {/* 展开审计面板 */}
          {showDetailDrawer && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1.5 text-[10px] animate-fade-in font-sans">
              <div className="flex justify-between text-zinc-400">
                <span>今日累计 Token:</span>
                <span className="font-mono text-zinc-200 font-semibold">{stats.todayTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>主力模型:</span>
                <span className="font-mono text-indigo-300">{stats.model}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>防御等级:</span>
                <span className="font-mono text-emerald-400 font-semibold">AST 隔离守护中</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
