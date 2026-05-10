import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SatyalokBadge } from "./SatyalokBadge";

import logo from "../assets/logo.png";

function SparkCanvas() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const ctx = c.getContext("2d")!;

        const resize = () => {
            c.width = c.offsetWidth;
            c.height = c.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const pts = Array.from({ length: 80 }, () => ({
            x: Math.random() * c.width,
            y: Math.random() * c.height,
            r: Math.random() * 1.8 + 0.5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(Math.random() * 1.5 + 0.5),
            a: Math.random() * 0.6 + 0.1,
        }));

        let id: number;
        const draw = () => {
            id = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, c.width, c.height);
            for (const p of pts) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = c.width;
                if (p.x > c.width) p.x = 0;
                if (p.y < 0) {
                    p.y = c.height;
                    p.x = Math.random() * c.width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 90, 31, ${p.a})`;

                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(255, 90, 31, 0.8)";
                ctx.fill();
            }
        };
        draw();
        return () => {
            cancelAnimationFrame(id);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={ref}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
    );
}

interface TL {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calc(t: string): TL {
    const d = new Date(t).getTime() - Date.now();
    if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(d / 86400000),
        hours: Math.floor((d / 3600000) % 24),
        minutes: Math.floor((d / 60000) % 60),
        seconds: Math.floor((d / 1000) % 60),
    };
}

function Unit({ value, label }: { value: number; label: string }) {
    const v = String(value).padStart(2, "0");
    return (
        <div className="flex-1 flex flex-col items-center">
            <div className="bg-[#0f0c0a]/60 backdrop-blur-md border border-[#ff5a1f]/25 border-t-[#ff5a1f]/50 rounded-[clamp(8px,2vw,12px)] py-[clamp(12px,3vw,20px)] w-full max-w-[90px] relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={value}
                        initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="block text-[clamp(1.4rem,5vw,2.8rem)] font-extrabold font-mono tracking-tighter text-white text-center drop-shadow-[0_0_20px_rgba(255,90,31,0.4)]"
                    >
                        {v}
                    </motion.span>
                </AnimatePresence>
            </div>
            <p className="mt-[clamp(8px,1.5vw,12px)] text-[clamp(0.55rem,2vw,0.75rem)] font-bold text-[#ff5a1f] uppercase tracking-widest">
                {label}
            </p>
        </div>
    );
}

const Separator = () => (
    <span className="text-[clamp(1.4rem,5vw,2.5rem)] text-white/20 pt-[clamp(10px,2.5vw,18px)] font-light shrink-0">
        :
    </span>
);

export function CountdownTimer({
    targetDate,
    onComplete,
}: {
    targetDate: string;
    onComplete?: () => void;
}) {
    const [tl, setTl] = useState<TL>(calc(targetDate));

    useEffect(() => {
        const t = setInterval(() => {
            const n = calc(targetDate);
            setTl(n);
            if (!n.days && !n.hours && !n.minutes && !n.seconds) {
                clearInterval(t);
                onComplete?.();
            }
        }, 1000);
        return () => clearInterval(t);
    }, [targetDate, onComplete]);

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#050404] bg-[radial-gradient(circle_at_50%_0%,#1a0a05_0%,#050404_80%)] overflow-hidden p-6 text-white">
            {/* Tactical Arena Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none bg-[size:40px_40px]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255, 90, 31, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 90, 31, 0.03) 1px, transparent 1px)
          `,
                }}
            />

            <SparkCanvas />

            <motion.div
                className="relative z-10 text-center w-full max-w-3xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* LOGO GOES HERE */}
                <div className="mb-10 flex flex-col justify-center">
                    <img
                        src={logo}
                        alt="Quiz Champ Logo"
                        className="h-40 md:h-60 object-contain drop-shadow-[0_0_15px_rgba(255,90,31,0.2)]"
                    />
                    <p className="sr-only">Quiz Champ 2026</p>
                    <SatyalokBadge variant="footer" />
                </div>

                {/* Timer Container - flex-nowrap ensures it stays on one line */}
                <div className="flex gap-[clamp(6px,1.5vw,16px)] justify-center flex-nowrap items-start w-full px-[clamp(10px,3vw,20px)]">
                    <Unit value={tl.days} label="Days" />
                    <Separator />
                    <Unit value={tl.hours} label="Hours" />
                    <Separator />
                    <Unit value={tl.minutes} label="Mins" />
                    <Separator />
                    <Unit value={tl.seconds} label="Secs" />
                </div>

                <h1 className="text-[clamp(2.2rem,8vw,4.5rem)] font-black text-white my-5 leading-tight uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    Registration{" "}
                    <br />
                    <span className="text-[#ff5a1f]">Opens Soon</span>
                </h1>

                <p className="text-[clamp(1rem,3vw,1.2rem)] text-[#86868b] leading-relaxed max-w-[85%] mx-auto mb-16">
                    The ultimate knowledge championship. Prepare your
                    strategies.
                </p>
            </motion.div>
        </div>
    );
}
