import { useRef, useEffect, useState, MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bulbIncandescent from '@assets/component-bulb.png';
import bulbHalogen from '@assets/generated_images/bulb-halogen.png';
import bulbCfl from '@assets/generated_images/bulb-cfl.png';
import bulbLed from '@assets/generated_images/bulb-led.png';

// ─── Media hooks ─────────────────────────────────────────────────────────────
function useReducedMotion() {
  const [v, setV] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const h = (e: MediaQueryListEvent) => setV(e.matches);
    mql.addEventListener('change', h);
    return () => mql.removeEventListener('change', h);
  }, []);
  return v;
}

function useIsMobile() {
  const [v, setV] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setV(window.innerWidth < 768);
    window.addEventListener('resize', h, { passive: true });
    return () => window.removeEventListener('resize', h);
  }, []);
  return v;
}

// ─── Cycling words ────────────────────────────────────────────────────────────
const WORDS = ['Build.', 'Simulate.', 'Test.', 'Fix.'];

// ─── Circuit graph ────────────────────────────────────────────────────────────
const NODES: [number, number][] = [
  [0.05,0.10],[0.18,0.10],[0.32,0.10],[0.50,0.10],[0.68,0.10],[0.82,0.10],[0.95,0.10], // row 0 idx 0-6
  [0.05,0.30],[0.18,0.30],[0.32,0.30],[0.50,0.30],[0.68,0.30],[0.82,0.30],[0.95,0.30], // row 1 idx 7-13
  [0.05,0.55],[0.18,0.55],[0.32,0.55],[0.50,0.55],[0.68,0.55],[0.82,0.55],[0.95,0.55], // row 2 idx 14-20
  [0.05,0.78],[0.18,0.78],[0.32,0.78],[0.50,0.78],[0.68,0.78],[0.82,0.78],[0.95,0.78], // row 3 idx 21-27
  [0.05,0.95],[0.32,0.95],[0.50,0.95],[0.68,0.95],[0.95,0.95],                          // row 4 idx 28-32
  // off-canvas extensions — let current pulses travel past the visible edge
  [-0.15,0.10],[1.15,0.10],   // idx 33-34: row0 left / right
  [-0.15,0.30],[1.15,0.30],   // idx 35-36: row1 left / right
  [-0.15,0.55],[1.15,0.55],   // idx 37-38: row2 left / right
  [-0.15,0.78],[1.15,0.78],   // idx 39-40: row3 left / right
  [0.50,-0.18],[0.50,1.18],   // idx 41-42: top-mid / bottom-mid
];

const EDGES: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],
  [7,8],[8,9],[9,10],[10,11],[11,12],[12,13],
  [14,15],[15,16],[16,17],[17,18],[18,19],[19,20],
  [21,22],[22,23],[23,24],[24,25],[25,26],[26,27],
  [28,29],[29,30],[30,31],[31,32],
  [0,7],[1,8],[2,9],[3,10],[4,11],[5,12],[6,13],
  [7,14],[8,15],[9,16],[10,17],[11,18],[12,19],[13,20],
  [14,21],[15,22],[16,23],[17,24],[18,25],[19,26],[20,27],
  [21,28],[23,29],[24,30],[25,31],[27,32],
  // off-canvas spurs
  [0,33],[6,34],[7,35],[13,36],[14,37],[20,38],[21,39],[27,40],[3,41],[30,42],
];

const ADJ: number[][] = NODES.map(() => []);
EDGES.forEach(([a, b]) => { ADJ[a].push(b); ADJ[b].push(a); });

// ─── Bulb configs — each sits exactly on a circuit joint (NODES[nodeIdx]) ──────
// Position is derived from the node's own graph coordinate, never a free-floating %.
const BULB_CONFIGS = [
  { nodeIdx: 5,  label: 'A19',     type: 'Incandescent', img: bulbIncandescent, glowRgb: '255,200,80',  size: 64 },
  { nodeIdx: 21, label: 'HALOGEN', type: 'Halogen',       img: bulbHalogen,      glowRgb: '255,225,150', size: 38 },
  { nodeIdx: 19, label: 'CFL',     type: 'Fluorescent',   img: bulbCfl,          glowRgb: '210,235,255', size: 52 },
  { nodeIdx: 26, label: 'LED',     type: 'LED',           img: bulbLed,          glowRgb: '255,244,214', size: 54 },
];

// MCB also sits on its own joint, mirroring the bulbs.
const MCB_NODE_IDX = 7;

// ─── Particle ─────────────────────────────────────────────────────────────────
interface Particle { from: number; to: number; t: number; speed: number; isAmber: boolean }
function makeParticle(): Particle {
  const [a, b] = EDGES[Math.floor(Math.random() * EDGES.length)];
  return { from: Math.random() > 0.5 ? a : b, to: Math.random() > 0.5 ? b : a, t: Math.random(), speed: 0.004 + Math.random() * 0.006, isAmber: Math.random() > 0.4 };
}

// ─── Canvas engine (light theme) ─────────────────────────────────────────────
function runCanvas(
  canvas: HTMLCanvasElement,
  activeRef: MutableRefObject<boolean>,
  nodeGlowRef: MutableRefObject<Float32Array>
) {
  const particles: Particle[] = Array.from({ length: 30 }, makeParticle);
  let rafId = 0;
  let inited = false;

  const resize = () => {
    const dpr = window.devicePixelRatio;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    inited = false;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const draw = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafId = requestAnimationFrame(draw); return; }
    const W = canvas.offsetWidth, H = canvas.offsetHeight;

    if (!inited) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, W, H);
      inited = true;
    }

    // Light-bg trail fade
    ctx.fillStyle = 'rgba(248,250,252,0.18)';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(37,99,235,0.05)';
    ctx.lineWidth = 1;
    const gs = 48;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Base traces
    ctx.lineWidth = 1.5;
    EDGES.forEach(([a,b]) => {
      const [ax,ay]=NODES[a], [bx,by]=NODES[b];
      ctx.strokeStyle = 'rgba(37,99,235,0.14)';
      ctx.beginPath(); ctx.moveTo(ax*W,ay*H); ctx.lineTo(bx*W,by*H); ctx.stroke();
    });

    // Decay node glow
    const ng = nodeGlowRef.current;
    for (let i = 0; i < ng.length; i++) ng[i] = Math.max(0, ng[i] - 0.035);

    // Particles
    if (activeRef.current) {
      particles.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) {
          ng[p.to] = 1;
          const nbrs = ADJ[p.to].filter(n => n !== p.from);
          const next = nbrs.length > 0 ? nbrs[Math.floor(Math.random()*nbrs.length)] : p.from;
          p.from = p.to; p.to = next; p.t = 0;
        }

        const [fx,fy]=NODES[p.from], [tx,ty]=NODES[p.to];
        const px=(fx+(tx-fx)*p.t)*W, py=(fy+(ty-fy)*p.t)*H;
        const tailT=Math.max(0,p.t-0.35);
        const tailX=(fx+(tx-fx)*tailT)*W, tailY=(fy+(ty-fy)*tailT)*H;

        const col = p.isAmber ? '#FFB800' : '#2563EB';
        const glowCol = p.isAmber ? 'rgba(255,184,0,' : 'rgba(37,99,235,';

        // Lit segment
        ctx.beginPath(); ctx.moveTo(tailX,tailY); ctx.lineTo(px,py);
        ctx.strokeStyle = glowCol+'0.7)'; ctx.lineWidth = 2.5;
        ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;

        // Dot
        ctx.beginPath(); ctx.arc(px,py,p.isAmber?3:2.5,0,Math.PI*2);
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = p.isAmber?20:14;
        ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    // Nodes
    NODES.forEach(([nx,ny],idx) => {
      const x=nx*W, y=ny*H, g=ng[idx];
      const isBulbNode = BULB_CONFIGS.some(bc => bc.nodeIdx === idx);
      ctx.beginPath();
      ctx.arc(x,y,g>0.1?5+g*3:isBulbNode?5:3,0,Math.PI*2);
      if (g > 0.1) {
        ctx.fillStyle = `rgba(255,184,0,${0.4+g*0.6})`;
        ctx.shadowColor = '#FFB800'; ctx.shadowBlur = 18*g;
      } else {
        ctx.fillStyle = isBulbNode ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.25)';
        ctx.shadowBlur = 0;
      }
      ctx.fill(); ctx.shadowBlur = 0;

      // Bulb node marker ring
      if (isBulbNode) {
        ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2);
        ctx.strokeStyle = g>0.1 ? `rgba(255,184,0,${g*0.6})` : 'rgba(37,99,235,0.12)';
        ctx.lineWidth = 1.5; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
      }
    });

    rafId = requestAnimationFrame(draw);
  };

  draw();
  return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
}

// ─── Main breaker switch — click to cut / restore the current flow ────────────
function MCBSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? 'Turn circuit power off' : 'Turn circuit power on'}
      className="group flex flex-col items-center gap-2 focus:outline-none"
    >
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Main Breaker</span>
      <div
        className="relative w-12 h-[68px] rounded-md flex flex-col items-center justify-between py-1.5 border shadow-[0_2px_10px_rgba(15,23,42,0.12)] transition-colors duration-200"
        style={{
          background: 'linear-gradient(180deg,#e6eaf0 0%,#cbd5e1 100%)',
          borderColor: on ? 'rgba(37,99,235,0.35)' : 'rgba(148,163,184,0.6)',
        }}
      >
        <span className={`text-[7px] font-bold tracking-wider ${on ? 'text-blue-600' : 'text-slate-400'}`}>ON</span>

        {/* Rocker track */}
        <div className="relative w-6 h-10 rounded-sm bg-slate-500/25 flex justify-center overflow-hidden">
          <motion.div
            className="absolute w-5 h-5 rounded-[3px]"
            style={{
              background: on
                ? 'linear-gradient(180deg,#3b82f6,#1d4ed8)'
                : 'linear-gradient(180deg,#f87171,#dc2626)',
              boxShadow: on ? '0 0 10px rgba(37,99,235,0.7)' : '0 0 6px rgba(220,38,38,0.5)',
            }}
            animate={{ top: on ? 1 : 17 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          />
        </div>

        <span className={`text-[7px] font-bold tracking-wider ${on ? 'text-slate-400' : 'text-red-500'}`}>OFF</span>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${on ? 'text-blue-600' : 'text-red-500'}`}>
        {on ? 'Power On' : 'Power Off'}
      </span>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveCircuit() {
  const sectionRef   = useRef<HTMLElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const nodeGlowRef  = useRef(new Float32Array(NODES.length));
  const activeRef    = useRef(true);
  const visibleRef   = useRef(true);
  const circuitOnRef = useRef(true);
  const bulbImgRefs  = useRef<Array<HTMLImageElement  | null>>(BULB_CONFIGS.map(() => null));
  const bulbAuraRefs = useRef<Array<HTMLDivElement | null>>(BULB_CONFIGS.map(() => null));

  const reducedMotion = useReducedMotion();
  const isMobile      = useIsMobile();
  const animate       = !reducedMotion && !isMobile;

  // Main-breaker toggle — user can cut/restore current flow
  const [circuitOn, setCircuitOn] = useState(true);
  const syncActive = () => { activeRef.current = visibleRef.current && circuitOnRef.current; };
  const toggleCircuit = () => {
    const next = !circuitOnRef.current;
    circuitOnRef.current = next;
    setCircuitOn(next);
    syncActive();
  };

  // Cycling headline
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWordIdx(p => (p+1)%WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  // Pause animation when off-screen
  useEffect(() => {
    if (!animate) return;
    const obs = new IntersectionObserver(
      ([e]) => { visibleRef.current = e.isIntersecting; syncActive(); },
      { threshold: 0.05 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [animate]);

  // Boot canvas
  useEffect(() => {
    if (!animate || !canvasRef.current) return;
    return runCanvas(canvasRef.current, activeRef, nodeGlowRef);
  }, [animate]);

  // Bulb glow DOM update loop (direct DOM — no React re-renders at 60fps)
  useEffect(() => {
    if (!animate) return;
    let rafId: number;
    const loop = () => {
      BULB_CONFIGS.forEach(({ nodeIdx, glowRgb }, i) => {
        const glow = nodeGlowRef.current[nodeIdx];
        const img  = bulbImgRefs.current[i];
        const aura = bulbAuraRefs.current[i];

        if (img) {
          if (glow > 0.12) {
            const b = 1.1 + glow * 1.1;
            const blur = Math.round(glow * 32);
            img.style.filter  = `brightness(${b}) drop-shadow(0 0 ${blur}px rgba(${glowRgb},0.95))`;
            img.style.opacity = '1';
          } else {
            img.style.filter  = 'brightness(0.45) grayscale(0.55)';
            img.style.opacity = '0.65';
          }
        }

        if (aura) {
          if (glow > 0.12) {
            aura.style.background = `radial-gradient(circle, rgba(${glowRgb},${(glow * 0.45).toFixed(2)}) 0%, transparent 70%)`;
          } else {
            aura.style.background = 'transparent';
          }
        }
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [animate]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-[100dvh] flex items-center overflow-hidden bg-[#F8FAFC]"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* ── Canvas background (desktop) ── */}
      {animate && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
      )}

      {/* ── Static grid fallback (mobile / reduced-motion) ── */}
      {!animate && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Bulb overlays — each pinned exactly to its circuit joint, hidden below tablet where the canvas itself is disabled ── */}
      {BULB_CONFIGS.map((cfg, i) => {
        const [nx, ny] = NODES[cfg.nodeIdx];
        return (
          <div
            key={i}
            className="hidden md:block absolute pointer-events-none z-[2]"
            style={{ left: `${nx * 100}%`, top: `${ny * 100}%`, transform: 'translate(-50%,-50%)' }}
          >
            {/* Ambient aura */}
            <div
              ref={el => { bulbAuraRefs.current[i] = el; }}
              className="absolute rounded-full"
              style={{ inset: '-28px', transition: 'background 0.25s ease' }}
              aria-hidden="true"
            />
            {/* Bulb image */}
            <img
              ref={el => { bulbImgRefs.current[i] = el; }}
              src={cfg.img}
              alt={`${cfg.type} bulb`}
              style={{ width: cfg.size, filter: 'brightness(0.45) grayscale(0.55)', opacity: 0.65, display: 'block', margin: '0 auto' }}
            />
            {/* Type badge */}
            <div className="text-center mt-1.5">
              <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-white/70 px-1.5 py-0.5 rounded whitespace-nowrap">
                {cfg.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* ── Main breaker — sits on its own joint, click to cut / restore current flow ── */}
      <div
        className="hidden md:block absolute z-[3]"
        style={{ left: `${NODES[MCB_NODE_IDX][0] * 100}%`, top: `${NODES[MCB_NODE_IDX][1] * 100}%`, transform: 'translate(-50%,-50%)' }}
      >
        <MCBSwitch on={circuitOn} onClick={toggleCircuit} />
      </div>

      {/* ── Hero content (centered) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-24 pb-16">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center">

          {/* Free badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50/90 backdrop-blur-sm text-blue-700 text-sm font-mono mb-8"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            FREE &amp; NO SIGN-UP REQUIRED
          </motion.div>

          {/* Headline */}
          <h1
            className="font-bold text-slate-900 leading-[1.05] mb-6 tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(3rem,7vw,5.5rem)' }}
          >
            <div style={{ height: '1.15em' }} className="relative overflow-hidden mb-1 flex justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={wordIdx}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
                  className="block text-slate-900"
                >
                  {WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-blue-600">Real Electrical<br/>Wiring.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
            ElectraSim is a free online electrical wiring simulator for building and testing realistic circuits directly in your browser.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <a
              href="https://electrasim.com/app/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all duration-200 shadow-[0_4px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_40px_rgba(37,99,235,0.5)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Launch the Simulator
            </a>
            <a
              href="#guide"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-slate-300 text-slate-700 font-medium hover:bg-white/80 hover:border-slate-400 transition-all duration-200"
            >
              See how it works ↓
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-sm text-slate-500">
            {['Works offline','No installation','No sign-up','Data stays local','Installable PWA'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-slate-400 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center pt-1.5"
          aria-hidden="true"
        >
          <motion.div
            className="w-1 h-1.5 bg-blue-500 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        scroll
      </motion.div>
    </section>
  );
}
