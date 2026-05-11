import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePortalState } from "../hooks/usePortalState";
import { CountdownTimer } from "../components/CountdownTimer";
import { ImageSlider } from "../components/ImageSlider";
import { BatchSelector } from "../components/BatchSelector";
import { RegistrationForm } from "../components/RegistrationForm";
import { MobileEntry } from "../components/MobileEntry";
import { OTPVerification } from "../components/OTPVerification";
import { PaymentGateway } from "../components/PaymentGateway";
import { ResultChecker } from "../components/ResultChecker";
import { SatyalokBadge } from "../components/SatyalokBadge";
import { UserProfile } from "../components/UserProfile";
import { SliderImage, BatchType, PaymentSession, ProfileData } from "../types";
import { portalApi, otpApi, profileApi } from "../api/client";

type Step = "home" | "mobile-entry" | "otp" | "form" | "payment" | "profile";

export function PublicPortal() {
    const {
        status,
        loading: portalLoading,
        error: portalError,
        refetch,
    } = usePortalState();

    // Global State
    const [images, setImages] = useState<SliderImage[]>([]);
    const [step, setStep] = useState<Step>("home");
    const [loadingProfile, setLoadingProfile] = useState(true);

    // User Journey State
    const [batch, setBatch] = useState<BatchType | null>(null);
    const [mobile, setMobile] = useState("");
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [session, setSession] = useState<PaymentSession | null>(null);

    // Initialize session and assets
    useEffect(() => {
        const initializePortal = async () => {
            try {
                // Fetch slider images
                portalApi
                    .getSliderImages()
                    .then((res) => setImages(res.data))
                    .catch((err) =>
                        console.error("Failed to load slider images:", err),
                    );

                // Fetch user profile session
                const response = await profileApi.getMe();
                const profileData = response.data.profile;

                setProfile(profileData);
                setMobile(profileData.mobileNumber);
                setBatch(profileData.batchType as BatchType);

                setStep(
                    profileData.paymentStatus === "COMPLETED"
                        ? "profile"
                        : "form",
                );
            } catch (error) {
                // No active session, user remains on 'home'
                console.info("No active user session found.");
            } finally {
                setLoadingProfile(false);
            }
        };

        initializePortal();
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await otpApi.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Always clear state locally even if API fails to prevent ghost sessions
            setMobile("");
            setBatch(null);
            setProfile(null);
            setSession(null);
            setStep("home");
        }
    }, []);

    const handleBackToHome = useCallback(() => {
        setBatch(null);
        setStep("home");
    }, []);

    // --- Loading & Error States ---
    if (portalLoading || loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-[100dvh] bg-[#fbfbfd]">
                <div className="w-6 h-6 border-2 border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin" />
            </div>
        );
    }

    if (portalError || !status) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#fbfbfd] p-6">
                <p className="text-[#86868b] mb-4 text-center">
                    Unable to load portal configuration.
                </p>
                <button
                    onClick={refetch}
                    className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#005bb5] transition-colors text-white rounded-full font-semibold text-sm"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (status.state === "CLOSED") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#fbfbfd] p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md w-full flex flex-col items-center"
                >
                    <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-3">
                        Quiz Champ 2026
                    </p>
                    <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-[#1d1d1f] mb-3">
                        Coming Soon
                    </h1>
                    <p className="text-[#86868b] leading-relaxed mb-10">
                        Registration is currently closed. Stay tuned for
                        updates.
                    </p>
                    <SatyalokBadge variant="footer" />
                </motion.div>
            </div>
        );
    }

    if (status.state === "COUNTDOWN") {
        return (
            <CountdownTimer
                targetDate={status.openingDate}
                onComplete={refetch}
            />
        );
    }

    // --- Router Engine ---
    const renderStep = () => {
        switch (step) {
            case "payment":
                return session ? (
                    <PaymentGateway
                        session={session}
                        onFailure={(msg) => alert(msg)}
                    />
                ) : null;

            case "profile":
                return profile ? (
                    <UserProfile
                        profile={profile}
                        onLogout={handleLogout}
                        onCompletePayment={() => setStep("form")}
                    />
                ) : null;

            case "form":
                return batch && mobile ? (
                    <RegistrationForm
                        batchType={batch}
                        mobileNumber={mobile}
                        sessionToken="" // Backend uses HTTP-only cookie
                        draft={profile}
                        onSuccess={(paymentSession) => {
                            setSession(paymentSession);
                            setStep("payment");
                        }}
                        onBack={() => setStep("otp")}
                    />
                ) : null;

            case "otp":
                return mobile ? (
                    <OTPVerification
                        mobileNumber={mobile}
                        onSuccess={(result) => {
                            const profileData = result.profile;
                            setProfile(profileData);
                            if (profileData?.paymentStatus === "COMPLETED") {
                                setStep("profile");
                            } else {
                                setStep("form");
                            }
                        }}
                        onBack={() => setStep("mobile-entry")}
                    />
                ) : null;

            case "mobile-entry":
                return batch ? (
                    <MobileEntry
                        batchType={batch}
                        onSuccess={(mobileNumber) => {
                            setMobile(mobileNumber);
                            setStep("otp");
                        }}
                        onBack={handleBackToHome}
                    />
                ) : null;

            case "home":
            default:
                return (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <header className="mb-8">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2"
                            >
                                Registration Open
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-[#1d1d1f] mb-2"
                            >
                                Quiz Champ 2026
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[#86868b] text-sm leading-relaxed mb-4"
                            >
                                The ultimate knowledge championship for students
                                across all classes.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                <SatyalokBadge variant="inline" />
                            </motion.div>
                        </header>

                        {images.length > 0 && (
                            <motion.div
                                className="mb-8 rounded-2xl overflow-hidden shadow-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <ImageSlider images={images} />
                            </motion.div>
                        )}

                        <BatchSelector
                            onSelect={(b) => {
                                setBatch(b);
                                setStep("mobile-entry");
                            }}
                        />

                        {status.resultsPublished && (
                            <motion.div
                                className="mt-10 pt-8 border-t border-[#d2d2d7]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <ResultChecker />
                            </motion.div>
                        )}
                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-[100dvh] bg-white text-[#1d1d1f] selection:bg-[#0071e3]/20">
            {/* Mobile-first main container setup with a flex-col so the footer can be pushed to the bottom */}
            <main className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-[100dvh]">
                {/* Global Authenticated Header */}
                {profile && step !== "home" && (
                    <header className="flex justify-between items-center mb-6 pb-4 border-b border-[#d2d2d7]">
                        <div className="text-sm">
                            <span className="font-semibold text-[#1d1d1f]">
                                {mobile}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-500 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
                            aria-label="Logout"
                        >
                            Logout
                        </button>
                    </header>
                )}

                {/* Main Content Area */}
                <div className="flex-grow">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Sticky Footer */}
                <footer className="mt-12 pt-6">
                    <SatyalokBadge variant="footer" />
                </footer>
            </main>
        </div>
    );
}
