import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
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
import { SliderImage, BatchType, PaymentSession, ProfileData, FaqItem } from "../types";
import { portalApi, otpApi, profileApi, faqApi, setSessionToken, clearSessionToken } from "../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [step, setStep] = useState<Step>("home");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [openFaq, setOpenFaq] = useState<string | null>(null);

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

                // Fetch FAQs
                faqApi
                    .getPublished()
                    .then((res) => setFaqs(res.data))
                    .catch((err) =>
                        console.error("Failed to load FAQs:", err),
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
            <div className="flex items-center justify-center min-h-[100dvh] bg-background">
                <div className="size-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (portalError || !status) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-6">
                <p className="text-muted-foreground mb-4 text-center">
                    Unable to load portal configuration.
                </p>
                <Button onClick={refetch} variant="default">
                    Retry Connection
                </Button>
            </div>
        );
    }

    const importantDatesSection = (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
                    Important Dates
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Date to Apply</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.closingDate
                            ? `${new Date(status.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} ${new Date(status.closingDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}`
                            : 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Date of Examination</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.eventDate
                            ? new Date(status.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
                            : 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reporting Time</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.reportingTime || 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Exam Time</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.examTime || 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prize Distribution</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.prizeDistributionDate
                            ? `${new Date(status.prizeDistributionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}${status.prizeDistributionTime ? ` ${status.prizeDistributionTime}` : ''}`
                            : 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Result Announcement</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.resultPublicationDate
                            ? `${new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} ${new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}`
                            : 'Not Declared'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );

    const faqSection = faqs.length > 0 ? (
        <Card className="mt-10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
                        Frequently Asked Questions
                    </CardTitle>
                </div>
                <CardDescription>
                    Quick answers to common questions about Quiz Champ 2026.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
                {faqs.map((faq) => (
                    <div key={faq.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                            className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <span>{faq.question}</span>
                            <ChevronDown
                                className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                                    openFaq === faq.id ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                        <AnimatePresence initial={false}>
                            {openFaq === faq.id && (
                                <motion.div
                                    key="faq-answer"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </CardContent>
        </Card>
    ) : null;

    if (status.state === "CLOSED") {
        return (
            <div className="min-h-[100dvh] bg-background text-foreground">
                <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
                    <div className="flex-grow flex flex-col items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-md w-full flex flex-col items-center"
                        >
                            <p className="text-xs font-semibold text-primary tracking-[0.1em] uppercase mb-3">
                                Quiz Champ 2026
                            </p>
                            <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-foreground mb-3">
                                Coming Soon
                            </h1>
                            <p className="text-muted-foreground leading-relaxed mb-10">
                                Registration is currently closed. Stay tuned for updates.
                            </p>
                        </motion.div>
                        {importantDatesSection}
                        {faqSection}
                    </div>
                    <footer className="mt-14 pt-6">
                        <SatyalokBadge variant="footer" />
                    </footer>
                </main>
            </div>
        );
    }

    if (status.state === "COUNTDOWN") {
        return (
            <div className="min-h-[100dvh] bg-background text-foreground">
                <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
                    <div className="flex-grow">
                        <CountdownTimer
                            targetDate={status.openingDate}
                            onComplete={refetch}
                        />
                        <div className="mt-8">
                            {importantDatesSection}
                        </div>
                        {faqSection}
                    </div>
                    <footer className="mt-14 pt-6">
                        <SatyalokBadge variant="footer" />
                    </footer>
                </main>
            </div>
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
                                className="text-[clamp(1.75rem,6vw,2.5rem)] font-bold tracking-tight text-foreground leading-[1.1] mb-2"
                            >
                                Quiz Champ 2026
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[15px] text-muted-foreground leading-relaxed"
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

                        {importantDatesSection}

                        <BatchSelector
                            onSelect={(b) => {
                                setBatch(b);
                                setStep("mobile-entry");
                            }}
                        />

                        {faqSection}

                        {status.resultsPublished && (
                            <motion.div
                                className="mt-10 pt-8 border-t border-border"
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
        <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
            <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
                {/* Authenticated Header */}
                {profile && step !== "home" && (
                    <header className="flex justify-between items-center mb-7 pb-4 border-b border-border">
                        <div className="text-sm">
                            <span className="font-semibold text-foreground">
                                {mobile}
                            </span>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                        >
                            Logout
                        </Button>
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
