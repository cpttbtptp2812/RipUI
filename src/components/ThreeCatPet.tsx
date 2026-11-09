import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CatInteractionMode = 'idle' | 'walk' | 'pet' | 'laser' | 'eat' | 'startled';

interface ThreeCatPetProps {
  onPoke?: () => void;
  bubbleText?: string;
  isBreakerTripped?: boolean;
}

export const ThreeCatPet: React.FC<ThreeCatPetProps> = ({
  onPoke,
  bubbleText,
  isBreakerTripped = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CatInteractionMode>('idle');
  const [internalBubble, setInternalBubble] = useState<string | null>(null);
  const [isLaserOn, setIsLaserOn] = useState(false);
  const [laserScreenPos, setLaserScreenPos] = useState({ x: 0, y: 0 });
  const [purring, setPurring] = useState(false);

  // Three.js 内部引用
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rootModelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  
  // 关键可交互骨骼
  const headBoneRef = useRef<THREE.Object3D | null>(null);
  const neckBoneRef = useRef<THREE.Object3D | null>(null);
  const leftEarRef = useRef<THREE.Object3D | null>(null);
  const rightEarRef = useRef<THREE.Object3D | null>(null);
  const spineBonesRef = useRef<THREE.Object3D[]>([]);
  const tailBonesRef = useRef<THREE.Object3D[]>([]);

  // 鼠标交互状态
  const mouse3DTarget = useRef(new THREE.Vector2(0, 0));
  const isMouseDown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const petStrokeCount = useRef(0);

  // 1. Web Audio 极简拟音（呼噜声、吃鱼咀嚼脆响、惊吓跳跃音）
  const playSfx = (type: 'purr' | 'crunch' | 'jump' | 'laser') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      if (type === 'purr') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'crunch') {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(500 + i * 150, now + i * 0.08);
          gain.gain.setValueAtTime(0.06, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.06);
        }
      } else if (type === 'jump') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 190;

    // 1. 初始化纯透明场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 广角适中相机：完美容纳整只猫（不裁切，留足呼吸边距）
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.85, 2.5);
    camera.lookAt(0, 0.38, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 纯透明
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. 温暖立体的二次元灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    mainLight.position.set(2, 4, 3);
    scene.add(mainLight);

    // 边缘发光背光（勾勒出黑猫漂亮的轮廓线）
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(-3, 2, -2.5);
    scene.add(rimLight);

    // 3. 加载并精确归一化 3D 骨骼模型
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // 加载炭黑猫咪纹理
    const blackTex = textureLoader.load('/models/black_cat_tex.png');
    blackTex.flipY = false;

    loader.load(
      '/models/toon_cat_free.glb',
      (gltf) => {
        const root = gltf.scene;
        rootModelRef.current = root;

        // 精准比例归一化：确保整只猫咪完整居中、尺寸小巧精致
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // 目标高度约 1.2 单位，让小插件极其轻巧不占桌面
        const targetScale = 1.35 / maxDim;
        root.scale.multiplyScalar(targetScale);

        // 重新对齐到底座地面 (y = 0)
        box.setFromObject(root);
        box.getCenter(center);
        root.position.x = -center.x;
        root.position.y = -box.min.y;
        root.position.z = -center.z;
        root.rotation.y = Math.PI / 4.5; // 斜侧 40 度优美坐姿

        // 自定义纯正黑猫材质与骨骼拾取
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: blackTex,
              color: new THREE.Color(0x18181b),
              roughness: 0.8,
              metalness: 0.15,
            });
          }

          // 拾取交互骨骼
          const name = child.name;
          if (name === 'head_018') headBoneRef.current = child;
          else if (name === 'neck_017') neckBoneRef.current = child;
          else if (name === 'ear.L_019') leftEarRef.current = child;
          else if (name === 'ear.R_020') rightEarRef.current = child;
          else if (name.startsWith('tail')) tailBonesRef.current.push(child);
          else if (name.startsWith('spine') || name === 'torso_02') spineBonesRef.current.push(child);
        });

        scene.add(root);

        // 绑定四足真实步态
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(root);
          mixerRef.current = mixer;
          const walkAction = mixer.clipAction(gltf.animations[0]);
          walkActionRef.current = walkAction;
          walkAction.play();
          walkAction.timeScale = 0; // 默认打盹
        }
      },
      undefined,
      (err) => console.error('Error loading glb:', err)
    );

    // 4. 60fps 实时物理与活体交互循环
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 更新行走动画
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // 活体特性 1：真 3D 头部与视线灵动追随 (Real Eye/Head Tracking)
      if (headBoneRef.current) {
        // 抚摸模式下脑袋向上蹭手，平时追随鼠标
        if (purring) {
          headBoneRef.current.rotation.x = -0.25; // 抬头享受迎蹭
          headBoneRef.current.rotation.y = Math.sin(time * 6) * 0.08; // 微微磨蹭
        } else {
          const targetY = mouse3DTarget.current.x * 0.55;
          const targetX = -mouse3DTarget.current.y * 0.45;
          headBoneRef.current.rotation.y += (targetY - headBoneRef.current.rotation.y) * 0.12;
          headBoneRef.current.rotation.x += (targetX - headBoneRef.current.rotation.x) * 0.12;
        }
      }

      // 活体特性 2：耳尖随机抽动 (Ear Twitching)
      if (leftEarRef.current && rightEarRef.current) {
        const shouldFlick = Math.sin(time * 1.5) > 0.94;
        const flick = shouldFlick ? Math.sin(time * 25) * 0.15 : 0;
        leftEarRef.current.rotation.z = purring ? -0.2 : flick;
        rightEarRef.current.rotation.z = purring ? 0.2 : -flick;
      }

      // 活体特性 3：5 段物理连续骨骼波浪摆尾 (Fluid Wave Tail)
      if (tailBonesRef.current.length > 0) {
        const tailFreq = purring ? 4.5 : mode === 'walk' ? 3.0 : 1.8;
        const tailAmp = purring ? 0.22 : mode === 'walk' ? 0.18 : 0.09;
        tailBonesRef.current.forEach((bone, idx) => {
          bone.rotation.z = Math.sin(time * tailFreq + idx * 0.7) * tailAmp;
        });
      }

      // 活体特性 4：真 3D 胸腹起伏呼吸 (Breathing expansion)
      if (spineBonesRef.current.length > 0 && mode !== 'walk') {
        const breath = Math.sin(time * 2.2) * 0.015;
        spineBonesRef.current.forEach((bone) => {
          bone.scale.set(1 + breath, 1 + breath * 1.8, 1 + breath);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 鼠标在挂件视口内跟踪
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse3DTarget.current.set(x, y);

      // 激光笔坐标更新
      if (isLaserOn) {
        setLaserScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      // 抚摸手势检测：按住鼠标且在头顶区域移动
      if (isMouseDown.current) {
        const dist = Math.hypot(e.clientX - lastMousePos.current.x, e.clientY - lastMousePos.current.y);
        if (dist > 3) {
          petStrokeCount.current++;
          if (petStrokeCount.current > 8) {
            setPurring(true);
            playSfx('purr');
            setInternalBubble("呼噜呼噜……蹭蹭手，勉强让你摸两下。");
          }
        }
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleWindowMouseUp = () => {
      isMouseDown.current = false;
      petStrokeCount.current = 0;
      setTimeout(() => setPurring(false), 800);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [purring, isLaserOn, mode]);

  // 模式改变响应
  useEffect(() => {
    if (!walkActionRef.current || !rootModelRef.current) return;

    if (mode === 'walk') {
      walkActionRef.current.timeScale = 1.0;
      rootModelRef.current.rotation.y = Math.PI / 2;
    } else if (mode === 'eat') {
      walkActionRef.current.timeScale = 0.2;
      rootModelRef.current.rotation.y = Math.PI / 3;
    } else {
      walkActionRef.current.timeScale = 0;
      rootModelRef.current.rotation.y = Math.PI / 4.5;
    }
  }, [mode]);

  // 戳击/点击猫咪（惊吓轻跳）
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (!isLaserOn) {
      playSfx('jump');
      // 触电弹跳动效
      if (rootModelRef.current) {
        rootModelRef.current.position.y += 0.08;
        setTimeout(() => {
          if (rootModelRef.current) rootModelRef.current.position.y = 0;
        }, 180);
      }
      setInternalBubble("喵呜！别戳肚子！再戳老子咬你。");
      if (onPoke) onPoke();
    }
  };

  // 互动操作 1：投喂小鱼干
  const handleFeed = () => {
    setMode('eat');
    playSfx('crunch');
    setInternalBubble("嗅嗅……吧唧吧唧……算你懂事。");
    setTimeout(() => {
      setMode('idle');
      setInternalBubble("吃饱了，继续打盹，别打扰老子。");
    }, 2800);
  };

  // 互动操作 2：激光笔
  const handleToggleLaser = () => {
    const next = !isLaserOn;
    setIsLaserOn(next);
    if (next) {
      setInternalBubble("那个红点是什么东西？！盯——");
    } else {
      setInternalBubble("哼，幼稚的人类激光。");
    }
  };

  // 互动操作 3：走动漫步
  const handleToggleWalk = () => {
    if (mode === 'walk') {
      setMode('idle');
      setInternalBubble("累了，趴下打盹。");
    } else {
      setMode('walk');
      setInternalBubble("四足迈步巡逻中，踩地巡视代码！");
      setTimeout(() => {
        setMode('idle');
        setInternalBubble("巡逻结束，没发现明显 bug。");
      }, 5000);
    }
  };

  const currentBubble = internalBubble || bubbleText;

  return (
    <div className="relative flex flex-col items-center select-none group">
      
      {/* 灵动嘲讽气泡 */}
      {currentBubble && (
        <div className="absolute -top-7 z-40 bg-zinc-950/90 text-zinc-100 text-[11px] px-3 py-1 rounded-xl border border-zinc-700/80 shadow-2xl backdrop-blur-md pointer-events-none flex items-center space-x-1.5 animate-fade-in max-w-[240px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="truncate">{currentBubble}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-zinc-950/90 border-r border-b border-zinc-700/80 rotate-45" />
        </div>
      )}

      {/* 3D WebGL 小巧灵动视口（280px × 185px，完整容纳、不遮挡、不裁切） */}
      <div 
        ref={mountRef}
        onMouseDown={handleContainerMouseDown}
        className="w-[280px] h-[185px] relative cursor-pointer"
        title="按住鼠标在猫头上滑动可以【抚摸撸猫】，点击可以【戳它】，或者用下方道具互动！"
      >
        {/* 激光笔红外光斑 */}
        {isLaserOn && (
          <div 
            className="absolute z-50 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-rose-500 shadow-md shadow-rose-500 pointer-events-none animate-pulse"
            style={{
              left: `${laserScreenPos.x}px`,
              top: `${laserScreenPos.y}px`
            }}
          >
            <div className="absolute inset-0 rounded-full border border-rose-300 animate-ping" />
          </div>
        )}
      </div>

      {/* 抚摸提示或爱心特效 */}
      {purring && (
        <div className="absolute top-12 text-sm pointer-events-none animate-bounce">
          💖 呼噜呼噜...
        </div>
      )}

      {/* 底部小巧真实的接触阴影 */}
      <div className="w-40 h-2 bg-black/40 rounded-full blur-sm pointer-events-none -mt-3 mb-2" />

      {/* 灵巧真实互动工具条（极简小巧） */}
      <div className="flex items-center space-x-1 bg-zinc-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 shadow-lg">
        <button
          onClick={() => {
            setPurring(true);
            playSfx('purr');
            setInternalBubble("呼噜呼噜……下巴很舒服。");
            setTimeout(() => setPurring(false), 1500);
          }}
          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition active:scale-95"
          title="给猫猫挠下巴抚摸"
        >
          抚摸
        </button>

        <button
          onClick={handleFeed}
          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-amber-950/60 hover:text-amber-300 transition active:scale-95"
          title="投喂一条喷香小鱼干"
        >
          🐟 喂鱼
        </button>

        <button
          onClick={handleToggleLaser}
          className={`px-2 py-0.5 rounded-lg transition active:scale-95 ${
            isLaserOn ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-zinc-900 hover:bg-zinc-800'
          }`}
          title="打开逗猫激光笔"
        >
          🔴 激光
        </button>

        <button
          onClick={handleToggleWalk}
          className={`px-2 py-0.5 rounded-lg transition active:scale-95 ${
            mode === 'walk' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-zinc-900 hover:bg-zinc-800'
          }`}
          title="四足交叉迈步巡逻"
        >
          🐾 走动
        </button>
      </div>
    </div>
  );
};
