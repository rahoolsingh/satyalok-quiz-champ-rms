import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SliderImage } from '../types';

interface ImageSliderProps {
  images: SliderImage[];
  autoPlayInterval?: number;
}

export function ImageSlider({ images, autoPlayInterval = 5000 }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(next, autoPlayInterval);
    return () => clearInterval(t);
  }, [next, images.length, autoPlayInterval]);

  if (images.length === 0) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div style={wrap} role="region" aria-label="Event image slider">
      {/* Slide */}
      <div style={slideArea}>
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.img
            key={current}
            src={images[current].imageUrl}
            alt={`Slide ${current + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            style={imgStyle}
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div style={overlay} />

        {/* Nav buttons */}
        {images.length > 1 && (
          <>
            <motion.button
              style={{ ...navBtn, left: '16px' }}
              onClick={prev}
              whileHover={{ scale: 1.1, background: 'rgba(108,59,255,0.6)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous slide"
            >
              ‹
            </motion.button>
            <motion.button
              style={{ ...navBtn, right: '16px' }}
              onClick={next}
              whileHover={{ scale: 1.1, background: 'rgba(108,59,255,0.6)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next slide"
            >
              ›
            </motion.button>
          </>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={dots}>
          {images.map((_, i) => (
            <motion.button
              key={i}
              style={dotBase}
              animate={{ width: i === current ? 28 : 8, background: i === current ? '#8b5cf6' : 'rgba(255,255,255,0.3)' }}
              transition={{ duration: 0.3 }}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = { width: '100%', maxWidth: '960px', margin: '0 auto' };
const slideArea: React.CSSProperties = {
  position: 'relative', borderRadius: '20px', overflow: 'hidden',
  height: 'clamp(240px, 45vw, 480px)',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
};
const imgStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
};
const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(to top, rgba(10,10,15,0.6) 0%, transparent 50%)',
  pointerEvents: 'none',
};
const navBtn: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
  color: 'white', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '50%', width: '48px', height: '48px',
  fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', zIndex: 2, transition: 'background 0.2s',
};
const dots: React.CSSProperties = {
  display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px',
};
const dotBase: React.CSSProperties = {
  height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0,
};
