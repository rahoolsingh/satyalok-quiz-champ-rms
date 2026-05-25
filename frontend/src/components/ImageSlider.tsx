import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { SliderImage } from "../types";

interface Props {
    images: SliderImage[];
    autoPlayInterval?: number;
}

export function ImageSlider({ images, autoPlayInterval = 5000 }: Props) {
    const [current, setCurrent] = useState(0);
    const [dir, setDir] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    const next = useCallback(() => {
        setDir(1);
        setCurrent((c) => (c + 1) % images.length);
    }, [images.length]);

    const prev = useCallback(() => {
        setDir(-1);
        setCurrent((c) => (c - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1 || isPaused) return;
        const timer = setInterval(next, autoPlayInterval);
        return () => clearInterval(timer);
    }, [next, images.length, autoPlayInterval, isPaused]);

    const handleDragEnd = (
        _e: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
    ) => {
        if (info.offset.x < -50) next();
        else if (info.offset.x > 50) prev();
    };

    if (!images?.length) return null;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({
            x: direction > 0 ? "-100%" : "100%",
            opacity: 0,
        }),
    };

    return (
        <div
            className="w-full relative group"
            role="region"
            aria-roledescription="carousel"
            aria-label="Event image slider"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted ring-1 ring-foreground/10">
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                    <motion.img
                        key={current}
                        src={images[current].imageUrl}
                        alt={`Slide ${current + 1} of ${images.length}`}
                        custom={dir}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                    />
                </AnimatePresence>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            aria-label="Previous slide"
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground rounded-full size-9 flex items-center justify-center transition-all shadow-sm opacity-0 sm:group-hover:opacity-100 focus:opacity-100 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={next}
                            aria-label="Next slide"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background text-foreground rounded-full size-9 flex items-center justify-center transition-all shadow-sm opacity-0 sm:group-hover:opacity-100 focus:opacity-100 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-foreground/10 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                                aria-label={`Go to slide ${i + 1}`}
                                aria-current={i === current}
                                className={`rounded-full transition-all duration-300 outline-none ${
                                    i === current ? 'w-5 h-1.5 bg-foreground' : 'size-1.5 bg-foreground/50'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
