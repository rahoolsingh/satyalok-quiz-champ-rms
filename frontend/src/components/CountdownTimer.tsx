import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.25 + 0.08,
    }));
    let id: number;
    const draw = () => {
      id = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x = (p.x + p.vx + c.width) % c.width;
        p.y = (p.y + p.vy + c.height) % c.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,113,227,${p.a})`;
        ctx.fill();
      }
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

interface TL { days: number; hours: number; minutes: number; seconds: number }
function calc(t: string): TL {
  const d = new Date(t).getTime() - Date.now();
  if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return { days: Math.floor(d / 86400000), hours: Math.floor((d / 3600000) % 24), minutes: Math.floor((d / 60000) % 60), seconds: Math.floor((d / 1000) % 60) };
}

function Unit({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, '0');
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ background: 'white', border: '1px solid #d2d2d7', borderRadius: 12, padding: '18px 24px', minWidth: 80, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'block', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f' }}
          >
            {v}
          </motion.span>
        </AnimatePresence>
      </div>
      <p style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 500, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  );
}

export function CountdownTimer({ targetDate, onComplete }: { targetDate: string; onComplete?: () => void }) {
  const [tl, setTl] = useState<TL>(calc(targetDate));
  useEffect(() => {
    const t = setInterval(() => {
      const n = calc(targetDate);
      setTl(n);
      if (!n.days && !n.hours && !n.minutes && !n.seconds) { clearInterval(t); onComplete?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [targetDate, onComplete]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfbfd', overflow: 'hidden', padding: 24 }}>
      <ParticleCanvas />
      <motion.div
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 640, width: '100%' }}
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
      >
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0071e3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Quiz Champ 2026</p>
        <h1 style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1d1d1f', marginBottom: 12 }}>
          Registration opens soon
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#86868b', marginBottom: 48, lineHeight: 1.5 }}>
          The ultimate knowledge championship for students. Get ready.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Unit value={tl.days} label="Days" />
          <span style={{ fontSize: '2rem', color: '#d2d2d7', paddingTop: 20, fontWeight: 300 }}>:</span>
          <Unit value={tl.hours} label="Hours" />
          <span style={{ fontSize: '2rem', color: '#d2d2d7', paddingTop: 20, fontWeight: 300 }}>:</span>
          <Unit value={tl.minutes} label="Minutes" />
          <span style={{ fontSize: '2rem', color: '#d2d2d7', paddingTop: 20, fontWeight: 300 }}>:</span>
          <Unit value={tl.seconds} label="Seconds" />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #d2d2d7', margin: '40px auto', maxWidth: 320 }} />
        <p style={{ color: '#86868b', fontSize: '0.9rem' }}>Stay tuned — something extraordinary is coming</p>
      </motion.div>
    </div>
  );
}
