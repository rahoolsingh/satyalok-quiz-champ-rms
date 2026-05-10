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
    <div className="w-full" role="region" aria-label="Event image slider">
      <div className="relative rounded-xl overflow-hidden bg-[#f5f5f7]" style={{ height: 'clamp(200px,40vw,440px)' }}>
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
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white border-none rounded-full w-9 h-9 text-base flex items-center justify-center cursor-pointer transition-colors shadow-sm">
              ‹
            </button>
            <button onClick={next} aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white border-none rounded-full w-9 h-9 text-base flex items-center justify-center cursor-pointer transition-colors shadow-sm">
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-1.5 justify-center mt-3">
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
              animate={{ width: i === current ? 20 : 6, backgroundColor: i === current ? '#0071e3' : '#d2d2d7' }}
              transition={{ duration: 0.25 }}
              className="h-1.5 rounded-full border-none cursor-pointer p-0"
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
