import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SliderImage } from '../types';

export function ImageSlider({ images, autoPlayInterval = 5000 }: { images: SliderImage[]; autoPlayInterval?: number }) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  const next = useCallback(() => { setDir(1); setCurrent(c => (c + 1) % images.length); }, [images.length]);
  const prev = () => { setDir(-1); setCurrent(c => (c - 1 + images.length) % images.length); };

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(next, autoPlayInterval);
    return () => clearInterval(t);
  }, [next, images.length, autoPlayInterval]);

  if (!images.length) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 'clamp(200px,40vw,440px)', background: '#f5f5f7' }} role="region" aria-label="Event image slider">
        <AnimatePresence custom={dir} mode="popLayout">
          <motion.img
            key={current}
            src={images[current].imageUrl}
            alt={`Slide ${current + 1}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={next} aria-label="Next" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
              animate={{ width: i === current ? 20 : 6, background: i === current ? '#0071e3' : '#d2d2d7' }}
              transition={{ duration: 0.25 }}
              style={{ height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
