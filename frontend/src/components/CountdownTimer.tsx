import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Precision Grid Background ─────────────────────────────────────────────────
function StructuralBackground() {
  return (
    <div style={bgWrapper}>
      {/* Animated radial glow to act as a spotlight */}
      <motion.div
        style={spotlight}
        animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Precision grid pattern */}
      <div style={gridPattern} />
      {/* Vignette to fade out the edges */}
      <div style={vignette} />
    </div>
  );
}

// ── Time Calculation ──────────────────────────────────────────────────────────
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ── 3D Rolodex Unit ───────────────────────────────────────────────────────────
function PremiumUnit({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  
  return (
    <div style={unitContainer}>
      <div style={cardGlass}>
        {/* Subtle top inner shadow for depth */}
        <div style={cardHighlight} />
        
        <div style={digitWrapper}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, rotateX: -90, y: 20 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: 90, y: -20 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 15 }}
              style={digitText}
            >
              {pad(value)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <span style={unitLabel}>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [tl, setTl] = useState<TimeLeft>(calcTimeLeft(targetDate));

  useEffect(() => {
    const t = setInterval(() => {
      const next = calcTimeLeft(targetDate);
      setTl(next);
      if (!next.days && !next.hours && !next.minutes && !next.seconds) {
        clearInterval(t);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [targetDate, onComplete]);

  return (
    <div style={pageLayout}>
      <StructuralBackground />

      <motion.div
        style={contentWrapper}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div style={badgeContainer} whileHover={{ scale: 1.05 }}>
          <div style={badgeDot} />
          <span style={badgeText}>Global Registration Opening</span>
        </motion.div>

        <h1 style={titleStyle}>
          Quiz Champ
          <br />
          <span style={gradientText}>2026.</span>
        </h1>

        <div style={timerDock}>
          <PremiumUnit value={tl.days} label="Days" />
          <div style={divider} />
          <PremiumUnit value={tl.hours} label="Hours" />
          <div style={divider} />
          <PremiumUnit value={tl.minutes} label="Minutes" />
          <div style={divider} />
          <PremiumUnit value={tl.seconds} label="Seconds" />
        </div>

        <p style={subtextStyle}>
          Prepare yourself. The ultimate test of intellect is approaching.
        </p>
      </motion.div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pageLayout: React.CSSProperties = {
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#050505',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: 'hidden',
  padding: '20px'
};

// Background
const bgWrapper: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' };
const gridPattern: React.CSSProperties = { 
  position: 'absolute', inset: 0, 
  backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
  backgroundSize: '40px 40px',
  backgroundPosition: 'center center'
};
const spotlight: React.CSSProperties = { 
  position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', 
  width: '80vw', height: '60vh', 
  background: 'radial-gradient(ellipse at center, rgba(186, 161, 99, 0.15) 0%, transparent 70%)',
  borderRadius: '50%', filter: 'blur(60px)'
};
const vignette: React.CSSProperties = { 
  position: 'absolute', inset: 0, 
  background: 'radial-gradient(circle at center, transparent 30%, #050505 100%)' 
};

// Layout
const contentWrapper: React.CSSProperties = { position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '900px' };

// Elements
const badgeContainer: React.CSSProperties = { 
  display: 'flex', alignItems: 'center', gap: '8px', 
  padding: '6px 16px', borderRadius: '100px', 
  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
  marginBottom: '32px', cursor: 'default'
};
const badgeDot: React.CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d4af37', boxShadow: '0 0 10px rgba(212, 175, 55, 0.8)' };
const badgeText: React.CSSProperties = { color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 500 };

const titleStyle: React.CSSProperties = { 
  fontSize: 'clamp(3.5rem, 8vw, 6rem)', fontWeight: 800, 
  letterSpacing: '-0.03em', lineHeight: 1, 
  color: '#ffffff', margin: '0 0 48px 0',
  textShadow: '0 10px 30px rgba(0,0,0,0.5)'
};
const gradientText: React.CSSProperties = { 
  background: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)', 
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  display: 'inline-block'
};

// Timer UI
const timerDock: React.CSSProperties = { 
  display: 'flex', alignItems: 'center', gap: '16px',
  padding: '24px', borderRadius: '24px',
  background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.4) 0%, rgba(15, 15, 15, 0.8) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)'
};

const unitContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: 'clamp(70px, 12vw, 100px)' };
const cardGlass: React.CSSProperties = { 
  position: 'relative', width: '100%', height: 'clamp(80px, 14vw, 110px)', 
  background: '#0a0a0a', borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: 'inset 0 2px 10px rgba(255, 255, 255, 0.02), 0 10px 20px rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  perspective: '1000px'
};
const cardHighlight: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' };
const digitWrapper: React.CSSProperties = { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', transformStyle: 'preserve-3d' };
const digitText: React.CSSProperties = { 
  position: 'absolute', 
  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, 
  color: '#e4e4e7', fontVariantNumeric: 'tabular-nums' 
};
const unitLabel: React.CSSProperties = { color: '#71717a', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 };

const divider: React.CSSProperties = { width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.1)', alignSelf: 'center', transform: 'translateY(-15px)' };

const subtextStyle: React.CSSProperties = { 
  color: '#a1a1aa', fontSize: '1.1rem', fontWeight: 400, 
  marginTop: '48px', maxWidth: '500px', lineHeight: 1.6 
};