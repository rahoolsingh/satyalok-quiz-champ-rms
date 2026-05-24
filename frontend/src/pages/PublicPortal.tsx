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
import { WhatsAppHelp } from "../components/WhatsAppHelp";
import { SliderImage, BatchType, PaymentSession, ProfileData } from "../types";
import { portalApi, otpApi, profileApi, setSessionToken, clearSessionToken } from "../api/client";

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
            clearSessionToken();
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
                        portalStatus={status}
                        onLogout={handleLogout}
                        onCompletePayment={() => setStep("form")}
                        onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
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
                        onSuccess={async (result) => {
                            // Store session token for cross-domain auth (Safari/Samsung fix)
                            if (result.sessionToken) {
                                setSessionToken(result.sessionToken);
                            }
                            const profileData = result.profile;
                            setProfile(profileData);
                            
                            if (profileData?.paymentStatus === "COMPLETED") {
                                // Fetch complete profile data including admit card
                                try {
                                    const response = await profileApi.getMe();
                                    setProfile(response.data.profile);
                                } catch (error) {
                                    console.error("Failed to fetch complete profile:", error);
                                }
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
                        <header className="mb-7">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-3"
                            >
                                <SatyalokBadge variant="inline" />
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="text-[clamp(1.75rem,6vw,2.5rem)] font-bold tracking-tight text-[#1d1d1f] leading-[1.1] mb-2"
                            >
                                Quiz Champ 2026
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[15px] text-[#86868b] leading-relaxed"
                            >
                                The ultimate knowledge championship for students
                                across all classes.
                            </motion.p>
                        </header>

                        {images.length > 0 && (
                            <motion.div
                                className="mb-8"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <ImageSlider images={images} />
                            </motion.div>
                        )}

                        {/* Important Dates */}
                        <motion.div
                            className="mb-8 bg-[#f5f5f7] rounded-[14px] border border-[#e8e8ed] p-4"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-[13px] font-semibold text-[#424245] uppercase tracking-wide mb-3">Important Dates</h3>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#86868b]">Last Date to Apply</span>
                                    <span className="text-[13px] font-semibold text-[#1d1d1f]">
                                        {status.closingDate
                                            ? new Date(status.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
                                            : 'Not Declared'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#86868b]">Date of Examination</span>
                                    <span className="text-[13px] font-semibold text-[#1d1d1f]">
                                        {status.eventDate
                                            ? new Date(status.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
                                            : 'Not Declared'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#86868b]">Prize Distribution</span>
                                    <span className="text-[13px] font-semibold text-[#1d1d1f]">
                                        {status.prizeDistributionDate
                                            ? new Date(status.prizeDistributionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
                                            : 'Not Declared'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#86868b]">Result Announcement</span>
                                    <span className="text-[13px] font-semibold text-[#1d1d1f]">
                                        {status.resultPublicationDate
                                            ? `${new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} ${new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}`
                                            : 'Not Declared'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        <BatchSelector
                            onSelect={(b) => {
                                setBatch(b);
                                setStep("mobile-entry");
                            }}
                        />

                        {status.resultsPublished && (
                            <motion.div
                                className="mt-10 pt-8 border-t border-[#e8e8ed]"
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
        <div className="min-h-[100dvh] bg-[#fbfbfd] text-[#1d1d1f] selection:bg-[#0071e3]/20">
            <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
                {/* Authenticated Header */}
                {profile && step !== "home" && (
                    <header className="flex justify-between items-center mb-7 pb-4 border-b border-[#e8e8ed]">
                        <div className="text-[14px]">
                            <span className="font-semibold text-[#1d1d1f]">
                                {mobile}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-[14px] text-red-500 hover:text-red-600 transition-colors font-medium"
                            aria-label="Logout"
                        >
                            Logout
                        </button>
                    </header>
                )}

                {/* Main Content */}
                <div className="flex-grow">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <footer className="mt-14 pt-6">
                    <SatyalokBadge variant="footer" />
                </footer>
            </main>

            <WhatsAppHelp />
        </div>
    );
}
