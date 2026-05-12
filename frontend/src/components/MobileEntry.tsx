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

// Define explicit API Error interface for strict typing
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
            ? "🎓 Junior Batch · Classes 5–10"
            : "🏆 Senior Batch · Classes 10+";

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
            className="w-full max-w-md mx-auto h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="text-[#0071e3] text-sm font-medium mb-6 flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
                &larr; Back
            </button>

            <header className="mb-8">
                <p className="text-xs font-semibold text-[#0071e3] tracking-widest uppercase mb-2">
                    Step 1 of 3
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">
                    Verify WhatsApp number
                </h2>
                <p className="text-[#86868b] text-base mb-2">
                    Enter your WhatsApp number to receive an OTP.
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-[#1d1d1f]">
                    {batchLabel}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {alreadyRegistered && (
                    <motion.div
                        key="registered-alert"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl mb-6 text-sm flex flex-col gap-1.5"
                        role="alert"
                    >
                        <span className="font-medium">
                            This number is already registered.
                        </span>
                        <Link
                            to="/"
                            className="text-amber-900 font-semibold hover:underline inline-flex items-center gap-1 w-fit"
                        >
                            Login to view your admit card &rarr;
                        </Link>
                    </motion.div>
                )}

                {error && !alreadyRegistered && (
                    <motion.div
                        key="error-alert"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
                        role="alert"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-8">
                    <label
                        htmlFor="mobile-input"
                        className="block text-sm font-semibold text-[#1d1d1f] mb-2"
                    >
                        WhatsApp Number{" "}
                        <span className="text-red-500" aria-hidden="true">
                            *
                        </span>
                    </label>

                    {/* Unified Input Wrapper */}
                    <div
                        className={`group relative flex items-center w-full transition-all duration-200 border rounded-xl overflow-hidden bg-white
                            ${
                                error
                                    ? "border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20"
                                    : "border-gray-300 focus-within:border-[#0071e3] focus-within:ring-4 focus-within:ring-[#0071e3]/20"
                            }
                        `}
                    >
                        <span className="flex items-center justify-center px-4 py-3.5 text-[#86868b] bg-gray-50 border-r border-gray-200 font-medium select-none">
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
                                setMobile(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10),
                                )
                            }
                            placeholder="10-digit WhatsApp number"
                            className="flex-1 w-full px-4 py-3.5 text-[#1d1d1f] text-base bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-60 disabled:bg-gray-50"
                        />
                    </div>
                    <p className="text-sm text-[#86868b] mt-3 flex items-center gap-1.5">
                        <svg
                            className="w-4 h-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                        </svg>
                        You will receive OTP on WhatsApp
                    </p>
                    <p className="text-xs text-[#86868b] mt-2 text-center text-red-500">
                        <span className="font-bold whitespace-nowrap">Note: </span>
                        One WhatsApp number can only be used for one registration.
                    </p>
                </div>

                <motion.button
                    type="submit"
                    disabled={loading || mobile.length < 10}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3.5 px-6 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all duration-200 mt-auto
                        ${
                            mobile.length < 10
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#0071e3] hover:bg-[#005bb5] text-white shadow-md hover:shadow-lg"
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Sending OTP...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Send OTP
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}
