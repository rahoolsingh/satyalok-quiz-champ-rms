import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { BatchType } from "../types";
import { otpApi } from "../api/client";

interface Props {
    batchType: BatchType;
    onSuccess: (mobile: string) => void;
    onBack: () => void;
}

export function MobileEntry({ batchType, onSuccess, onBack }: Props) {
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [focused, setFocused] = useState(false);

    const batchLabel =
        batchType === "JUNIOR"
            ? "🎓 Junior Batch · Classes 1–7"
            : "🏆 Senior Batch · Classes 8–12";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
            setError("Enter a valid 10-digit mobile number");
            return;
        }
        setError("");
        setLoading(true);
        setAlreadyRegistered(false);
        try {
            await otpApi.send(mobile.trim());
            onSuccess(mobile.trim());
        } catch (err: unknown) {
            const e = err as {
                response?: {
                    data?: { error?: string; alreadyRegistered?: boolean };
                };
            };
            if (e.response?.data?.alreadyRegistered) {
                setAlreadyRegistered(true);
            } else {
                setError(
                    e.response?.data?.error ||
                        "Failed to send OTP. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
        >
            <button
                onClick={onBack}
                className="text-[#0066cc] text-sm font-medium mb-6 block hover:opacity-75 transition-opacity"
            >
                ← Back
            </button>

            <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">
                Step 1 of 3
            </p>
            <h2 className="text-[clamp(1.25rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-2">
                Verify mobile number
            </h2>
            <p className="text-[#86868b] text-sm mb-1">
                Enter your mobile number to receive OTP.
            </p>
            <p className="text-sm text-[#1d1d1f] font-medium mb-6">
                {batchLabel}
            </p>

            <AnimatePresence>
                {alreadyRegistered && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-5 text-sm overflow-hidden"
                    >
                        This number is already registered.{" "}
                        <Link to="/" className="font-semibold underline">
                            Login to view your admit card →
                        </Link>
                    </motion.div>
                )}
                {error && !alreadyRegistered && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[#ef4444] text-sm mb-4"
                        role="alert"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                {/* Mobile input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                        Mobile Number <span className="text-[#0071e3]">*</span>
                    </label>
                    <div className="flex items-center gap-0">
                        <span
                            className={`px-3 sm:px-3.5 py-2.5 bg-[#f5f5f7] border rounded-l-lg text-sm text-[#86868b] transition-all
              ${focused ? "border-[#0071e3]" : "border-[#d2d2d7]"}`}
                        >
                            +91
                        </span>
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={mobile}
                            onChange={(e) =>
                                setMobile(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10),
                                )
                            }
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="10-digit mobile number"
                            className={`flex-1 px-3 sm:px-3.5 py-2.5 bg-white text-[#1d1d1f] rounded-r-lg text-sm outline-none transition-all border
                ${focused ? "border-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.2)]" : "border-[#d2d2d7]"}`}
                        />
                    </div>
                    <p className="text-xs text-[#86868b] mt-2 flex items-center gap-1.5">
                        <span className="text-base">💬</span>
                        You will receive OTP on WhatsApp
                    </p>
                </div>

                <motion.button
                    type="submit"
                    disabled={loading || mobile.length < 10}
                    whileHover={{
                        opacity: !loading && mobile.length >= 10 ? 0.88 : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2 transition-colors
            ${mobile.length < 10 ? "bg-[#d2d2d7] text-[#86868b] cursor-default" : "bg-[#0071e3] text-white"}`}
                >
                    {loading && (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Sending OTP…" : "Send OTP →"}
                </motion.button>
            </form>
        </motion.div>
    );
}
