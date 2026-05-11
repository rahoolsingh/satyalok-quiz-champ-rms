import React from "react";
import { motion } from "framer-motion";
import { BatchType } from "../types";

const batches = [
    {
        type: "JUNIOR" as BatchType,
        label: "Junior Batch",
        sub: "Classes 5 – 10",
        classes: "Standard 5 to Standard 10",
        icon: "🎓",
    },
    {
        type: "SENIOR" as BatchType,
        label: "Senior Batch",
        sub: "Classes 10+",
        classes: "Post-10th, College & Beyond",
        icon: "🏆",
    },
];

interface Props {
    onSelect: (b: BatchType) => void;
}

export function BatchSelector({ onSelect }: Props) {
    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <header className="mb-8">
                <p className="text-xs font-semibold text-[#0071e3] tracking-widest uppercase mb-2">
                    Step 1 of 3
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">
                    Choose your batch
                </h2>
                <p className="text-[#86868b] text-base leading-relaxed">
                    Select the category that matches your class.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {batches.map((b) => (
                    <motion.button
                        key={b.type}
                        onClick={() => onSelect(b.type)}
                        whileTap={{ scale: 0.98 }}
                        aria-label={`Register for ${b.label}`}
                        className="group relative flex items-center gap-4 p-5 rounded-2xl text-left bg-white transition-all duration-200 border-2 border-gray-100 hover:border-[#0071e3] hover:shadow-md focus:outline-none focus-visible:border-[#0071e3] focus-visible:ring-4 focus-visible:ring-[#0071e3]/20"
                    >
                        {/* Icon Container */}
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors shrink-0">
                            <span className="text-3xl">{b.icon}</span>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base text-[#1d1d1f] mb-0.5 group-hover:text-[#0071e3] transition-colors">
                                {b.label}
                            </p>
                            <p className="text-sm font-medium text-gray-600">
                                {b.sub}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {b.classes}
                            </p>
                        </div>

                        {/* Animated Arrow */}
                        <span className="text-gray-300 group-hover:text-[#0071e3] text-xl shrink-0 transition-all duration-300 group-hover:translate-x-1">
                            &rarr;
                        </span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
