import React from "react";
import { motion } from "framer-motion";
import { BatchType } from "../types";

const batches = [
    {
        type: "JUNIOR" as BatchType,
        label: "Junior Batch",
        sub: "Class 5 - 10",
        icon: "🎓",
        color: "from-blue-500 to-blue-600",
        lightBg: "bg-blue-50",
    },
    {
        type: "SENIOR" as BatchType,
        label: "Senior Batch",
        sub: "Class 10+",
        icon: "🏆",
        color: "from-purple-500 to-purple-600",
        lightBg: "bg-purple-50",
    },
];

interface Props {
    onSelect: (b: BatchType) => void;
}

export function BatchSelector({ onSelect }: Props) {
    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <h2 className="text-[15px] font-semibold text-[#424245] uppercase tracking-wide mb-4">
                Select your batch
            </h2>

            <div className="grid grid-cols-1 gap-3">
                {batches.map((b, i) => (
                    <motion.button
                        key={b.type}
                        onClick={() => onSelect(b.type)}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        aria-label={`Register for ${b.label}`}
                        className="group relative flex items-center gap-4 p-5 rounded-[16px] text-left bg-white transition-all duration-200 border-[1.5px] border-[#e8e8ed] hover:border-[#0071e3] hover:shadow-[0_2px_12px_rgba(0,113,227,0.1)] focus:outline-none focus-visible:border-[#0071e3] focus-visible:ring-4 focus-visible:ring-[#0071e3]/10"
                    >
                        <div className={`flex items-center justify-center w-[52px] h-[52px] rounded-[14px] ${b.lightBg} group-hover:scale-105 transition-transform shrink-0`}>
                            <span className="text-[28px]">{b.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[16px] text-[#1d1d1f] mb-0.5 group-hover:text-[#0071e3] transition-colors">
                                {b.label}
                            </p>
                            <p className="text-[14px] text-[#86868b]">
                                {b.sub}
                            </p>
                        </div>

                        <svg className="w-5 h-5 text-[#c7c7cc] group-hover:text-[#0071e3] shrink-0 transition-all duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
