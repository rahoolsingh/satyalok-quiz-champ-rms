import { motion } from "framer-motion";
import { GraduationCap, Trophy, ChevronRight } from "lucide-react";
import { BatchType } from "../types";

const batches = [
    {
        type: "JUNIOR" as BatchType,
        label: "Junior Batch",
        sub: "Class 5 - 10",
        icon: GraduationCap,
    },
    {
        type: "SENIOR" as BatchType,
        label: "Senior Batch",
        sub: "Class 11+ (Inter, Graduation & Govt. Exam Aspirants)",
        icon: Trophy,
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Select your batch
            </h2>

            <div className="flex flex-col gap-3">
                {batches.map((b, i) => (
                    <motion.button
                        key={b.type}
                        onClick={() => onSelect(b.type)}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        aria-label={`Register for ${b.label}`}
                        className="group relative flex items-center gap-4 p-5 rounded-xl bg-card text-left ring-1 ring-foreground/10 transition-all duration-200 hover:ring-primary/30 hover:shadow-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        <div className="flex items-center justify-center size-[52px] rounded-xl bg-muted group-hover:scale-105 transition-transform shrink-0">
                            <b.icon className="size-6 text-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base text-foreground mb-0.5 group-hover:text-primary transition-colors">
                                {b.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {b.sub}
                            </p>
                        </div>

                        <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
