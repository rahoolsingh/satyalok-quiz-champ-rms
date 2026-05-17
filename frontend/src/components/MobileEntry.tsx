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

interface ApiError {
    response?: {
        data?: {
            error?: string;
            alreadyRegistered?: boolean;
        };
    };
}

export function MobileEntry({ batchType, onSuccess, onBack }: Props) {
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    const batchLabel =
        batchType === "JUNIOR"
            ? "Junior Batch (Class 5-10)"
            : "Senior Batch (Class 10+)";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanMobile = mobile.trim();
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            setError("Please enter a valid 10-digit WhatsApp number");
            return;
        }

        setError("");
        setLoading(true);
        setAlreadyRegistered(false);

        try {
            await otpApi.send(cleanMobile);
            onSuccess(cleanMobile);
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const errorData = apiError.response?.data;

            if (errorData?.alreadyRegistered) {
                setAlreadyRegistered(true);
            } else {
                setError(
                    errorData?.error || "Failed to send OTP. Please try again.",
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
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {/* Back button */}
            <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="text-[#0071e3] text-[15px] font-medium mb-7 flex items-center gap-1.5 hover:opacity-70 transition-opacity disabled:opacity-40"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-[#0071e3]/8 rounded-full text-[12px] font-semibold text-[#0071e3] tracking-wide">
                        Step 1 of 3
                    </span>
                </div>
                <h2 className="text-[26px] font-bold tracking-tight text-[#1d1d1f] leading-tight mb-2">
                    Enter your number
                </h2>
                <p className="text-[15px] text-[#86868b] leading-relaxed">
                    We'll send a verification code to your WhatsApp.
                </p>
            </header>

            {/* Batch indicator */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f5f5f7] rounded-[12px] mb-7 border border-[#e8e8ed]">
                <div className={`w-2.5 h-2.5 rounded-full ${batchType === 'JUNIOR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <span className="text-[14px] font-medium text-[#1d1d1f]">{batchLabel}</span>
            </div>

            {/* Alerts */}
            <AnimatePresence mode="wait">
                {alreadyRegistered && (
                    <motion.div
                        key="registered-alert"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-amber-50 border border-amber-200/80 px-4 py-3.5 rounded-[12px] mb-6"
                        role="alert"
                    >
                        <p className="text-[14px] text-amber-800 font-medium mb-1">
                            This number is already registered.
                        </p>
                        <Link
                            to="/"
                            className="text-[13px] text-amber-900 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                            Login to view your admit card →
                        </Link>
                    </motion.div>
                )}

                {error && !alreadyRegistered && (
                    <motion.div
                        key="error-alert"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-red-50 border border-red-200/80 px-4 py-3.5 rounded-[12px] mb-6"
                        role="alert"
                    >
                        <p className="text-[14px] text-red-700 font-medium">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-7">
                    <label
                        htmlFor="mobile-input"
                        className="block text-[13px] font-semibold text-[#424245] uppercase tracking-wide mb-2.5"
                    >
                        WhatsApp Number
                    </label>

                    <div
                        className={`relative flex items-center w-full transition-all duration-200 rounded-[14px] overflow-hidden bg-white border-[1.5px]
                            ${error
                                ? "border-red-300 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-100"
                                : "border-[#d2d2d7] focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/10"
                            }
                        `}
                    >
                        <span className="flex items-center justify-center px-4 py-[14px] text-[15px] text-[#86868b] bg-[#f9f9fb] border-r border-[#e8e8ed] font-medium select-none">
                            +91
                        </span>
                        <input
                            id="mobile-input"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={10}
                            value={mobile}
                            disabled={loading}
                            aria-invalid={!!error}
                            onChange={(e) =>
                                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            placeholder="10-digit number"
                            className="flex-1 w-full px-4 py-[14px] text-[17px] text-[#1d1d1f] bg-transparent outline-none placeholder:text-[#c7c7cc] disabled:opacity-50 font-medium tracking-wide"
                        />
                        {mobile.length === 10 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="pr-4"
                            >
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                        <span className="text-[13px] text-[#86868b]">OTP will be sent via WhatsApp</span>
                    </div>

                    <p className="text-[12px] text-red-500/80 mt-2.5 font-medium">
                        Note: One WhatsApp number can only be used for one registration.
                    </p>
                </div>

                <motion.button
                    type="submit"
                    disabled={loading || mobile.length < 10}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-[14px] px-6 rounded-[14px] text-[16px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200
                        ${mobile.length < 10
                            ? "bg-[#f5f5f7] text-[#c7c7cc] cursor-not-allowed"
                            : "bg-[#0071e3] hover:bg-[#005bb5] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_12px_rgba(0,113,227,0.35)]"
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                            Sending OTP...
                        </>
                    ) : (
                        "Continue"
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}
