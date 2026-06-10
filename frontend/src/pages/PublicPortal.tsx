import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { usePortalState } from "../hooks/usePortalState";
import { CountdownTimer } from "../components/CountdownTimer";
import { ImageSlider } from "../components/ImageSlider";
import { BatchSelector } from "../components/BatchSelector";
import { RegistrationForm } from "../components/RegistrationForm";
import { MobileEntry } from "../components/MobileEntry";
import { OTPVerification } from "../components/OTPVerification";
import { PaymentGateway } from "../components/PaymentGateway";
import { SatyalokBadge } from "../components/SatyalokBadge";
import { UserProfile } from "../components/UserProfile";
import { WhatsAppHelp, HelpSection } from "../components/WhatsAppHelp";
import { SliderImage, BatchType, PaymentSession, ProfileData, FaqItem } from "../types";
import { portalApi, otpApi, profileApi, faqApi, setSessionToken, clearSessionToken } from "../api/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Step = "home" | "mobile-entry" | "otp" | "form" | "payment" | "profile";

export function PublicPortal() {
    const { setTheme } = useTheme();
    const themeSet = useRef(false);

    // Force light theme for the public portal
    useEffect(() => {
        if (!themeSet.current) {
            setTheme("light");
            themeSet.current = true;
        }
    }, [setTheme]);

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

                // Check existing session via auth/me
                const response = await profileApi.getMe();
                const { authenticated, mobile: sessionMobile, profile: sessionProfile } = response.data;

                if (authenticated && sessionMobile) {
                    setMobile(sessionMobile);

                    if (sessionProfile) {
                        setProfile(sessionProfile);
                        if (sessionProfile.batchType) {
                            setBatch(sessionProfile.batchType as BatchType);
                        }
                        setStep(
                            sessionProfile.paymentStatus === "COMPLETED"
                                ? "profile"
                                : "form",
                        );
                    } else {
                        // Valid session, but user hasn't registered yet
                        // Stay on home so they can select batch and register
                        console.info("Session valid, no registration found yet.");
                    }
                }
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
            clearSessionToken();
            setMobile("");
            setBatch(null);
            setProfile(null);
            setSession(null);
            setStep("home");
            // Force page reload to reset state completely
            window.location.href = "/";
        }
    }, []);

    const handleBackToHome = useCallback(() => {
        setBatch(null);
        setStep("home");
    }, []);

    const isEventCompleted = useMemo(() => {
        if (!status?.eventDate) return false;
        
        try {
            const dateObj = new Date(status.eventDate);
            const year = dateObj.getFullYear();
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            const eventDateStr = `${year}-${month}-${day}`;
            
            let hours = 23;
            let minutes = 59;
            
            if (status.examTime) {
                const match = status.examTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
                if (match) {
                    let h = parseInt(match[1], 10);
                    const m = parseInt(match[2] || "0", 10);
                    const ampm = (match[3] || "").toUpperCase();
                    if (ampm === "PM" && h < 12) h += 12;
                    if (ampm === "AM" && h === 12) h = 0;
                    hours = h;
                    minutes = m;
                    // Add 3 hours for exam duration to safely hide it after exam ends
                    hours += 3; 
                }
            }
            
            if (hours >= 24) {
                hours = 23;
                minutes = 59;
            }
            
            const pad = (n: number) => n.toString().padStart(2, '0');
            // Construct string in IST (+05:30)
            const istString = `${eventDateStr}T${pad(hours)}:${pad(minutes)}:00+05:30`;
            const eventEndTime = new Date(istString);
            
            return new Date() > eventEndTime;
        } catch (e) {
            return false;
        }
    }, [status?.eventDate, status?.examTime]);

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
            <CardContent className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Date to Apply</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.closingDate
                            ? `${new Date(status.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} ${new Date(status.closingDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`
                            : 'Not Declared'}
                    </span>
                </div>
                
                {!isEventCompleted && (
                    <>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Date of Examination</span>
                            <span className="text-sm font-semibold text-foreground text-right">
                                {status.eventDate
                                    ? `${new Date(status.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}`
                                    : 'Not Declared'}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reporting Time</span>
                            <span className="text-sm font-semibold text-foreground text-right">
                                {status.reportingTime ? `${status.reportingTime} IST` : 'Not Declared'}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Exam Time</span>
                            <span className="text-sm font-semibold text-foreground text-right">
                                {status.examTime ? `${status.examTime} IST` : 'Not Declared'}
                            </span>
                        </div>
                    </>
                )}
                
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prize Distribution</span>
                    <span className="text-sm font-semibold text-foreground text-right">
                        {status.prizeDistributionDate
                            ? `${new Date(status.prizeDistributionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}${status.prizeDistributionTime ? ` ${status.prizeDistributionTime} IST` : ''}`
                            : 'Not Declared'}
                    </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Result Announcement</span>
                    <div className="text-right">
                        <span className="text-sm font-semibold text-foreground block">
                            {status.resultPublicationDate
                                ? `${new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })} ${new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`
                                : 'Not Declared'}
                        </span>

                    </div>
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
            <CardContent className="flex flex-col gap-1">
                {faqs.map((faq, idx) => (
                    <div key={faq.id} className="ring-1 ring-border rounded-lg overflow-hidden">
                        <Button
                            variant="ghost"
                            size="default"
                            onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                            className="w-full flex items-center justify-between px-4 py-3 h-auto min-h-0 text-left text-sm font-medium text-foreground whitespace-normal"
                            data-icon="inline-end"
                        >
                            <span className="flex-1 min-w-0 text-left"><span className="font-semibold text-foreground shrink-0">Q{idx + 1}:</span> {faq.question}</span>
                            <ChevronDown
                                className={`size-4 shrink-0 transition-transform duration-200 ${
                                    openFaq === faq.id ? 'rotate-180' : ''
                                }`}
                            />
                        </Button>
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
                                        <span className="font-semibold text-foreground">ANS:</span> {faq.answer}
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
        // Allow registered users with completed payment to access their profile
        if (profile && profile.paymentStatus === "COMPLETED") {
            // User is authenticated and has completed payment - show their profile
            return (
                <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
                    <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
                        {/* Authenticated Header */}
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

                        {/* Main Content */}
                        <div className="flex-grow">
                            <UserProfile
                                profile={profile}
                                portalStatus={status}
                                onLogout={handleLogout}
                                onCompletePayment={() => {}} // No action needed when registration is closed
                                onProfileUpdate={(updatedProfile) => setProfile(updatedProfile)}
                            />
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

        // Allow login flow for users trying to access their admit card
        if (step === "mobile-entry" || step === "otp") {
            return (
                <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
                    <main className="max-w-md mx-auto px-5 sm:px-6 py-8 sm:py-10 flex flex-col min-h-[100dvh]">
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
                                    {step === "otp" && mobile ? (
                                        <OTPVerification
                                            mobileNumber={mobile}
                                            onSuccess={async (result) => {
                                                if (result.sessionToken) {
                                                    setSessionToken(result.sessionToken);
                                                }
                                                const profileData = result.profile;
                                                setProfile(profileData);

                                                if (profileData?.paymentStatus === "COMPLETED") {
                                                    try {
                                                        const response = await profileApi.getMe();
                                                        setProfile(response.data.profile);
                                                    } catch (error) {
                                                        console.error("Failed to fetch complete profile:", error);
                                                    }
                                                    setStep("profile");
                                                } else {
                                                    // Registration not completed - show message and go back
                                                    alert("Your registration is not complete. Admit card is only available for users with completed payment.");
                                                    setMobile("");
                                                    setProfile(null);
                                                    setBatch(null);
                                                    setStep("home");
                                                }
                                            }}
                                            onBack={() => setStep("mobile-entry")}
                                        />
                                    ) : (
                                        <MobileEntry
                                            batchType={batch || "JUNIOR"}
                                            onSuccess={(mobileNumber) => {
                                                setMobile(mobileNumber);
                                                setStep("otp");
                                            }}
                                            onBack={() => {
                                                setStep("home");
                                                setBatch(null);
                                                setMobile("");
                                            }}
                                        />
                                    )}
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

        // Show closed message for non-authenticated users
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
                                {status.resultsPublished ? "Results Declared!" : "Registration Closed"}
                            </h1>
                            <p className="text-muted-foreground leading-relaxed mb-10">
                                {status.resultsPublished 
                                    ? "The results for Quiz Champ 2026 are now out! Login with your registered mobile number to check your marks and rank."
                                    : "Registration is currently closed. If you have already registered, please login to access your admit card."}
                            </p>
                            
                            {/* Login option for registered users */}
                            <Button
                                onClick={() => setStep("mobile-entry")}
                                variant="default"
                                className={isEventCompleted ? "mb-2" : "mb-10"}
                            >
                                {status.resultsPublished ? "Login to View Result" : "Login to Access Admit Card"}
                            </Button>
                            {isEventCompleted && !status.resultsPublished && (
                                <p className="text-sm text-blue-600 font-medium mb-10 px-4">
                                    {status.resultPublicationDate 
                                        ? `Awaiting Result. Results will be announced on ${new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST.`
                                        : "Awaiting Result. Results will be available soon (tentative). All times in IST."}
                                </p>
                            )}
                        </motion.div>
                        {importantDatesSection}
                        <HelpSection />
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
                        <HelpSection />
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
                        sessionToken=""
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
                            if (result.sessionToken) {
                                setSessionToken(result.sessionToken);
                            }
                            const profileData = result.profile;
                            setProfile(profileData);

                            if (profileData?.paymentStatus === "COMPLETED") {
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
                            {isEventCompleted && status.resultPublicationDate && !status.resultsPublished && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 }}
                                    className="mt-4 inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm border border-primary/20"
                                >
                                    Result Announcement: {new Date(status.resultPublicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} {new Date(status.resultPublicationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST
                                </motion.div>
                            )}
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

                        <HelpSection />

                        {faqSection}


                    </motion.div>
                );
        }
    };

    return (
        <div className="min-h-[100dvh] bg-gradient-to-b from-background to-secondary/20 text-foreground selection:bg-primary/20">
            <main className="max-w-xl mx-auto px-6 py-12 flex flex-col min-h-[100dvh]">
                
                {/* Main Content Area with Glassmorphism */}
                <div className="relative backdrop-blur-xl bg-card/60 border border-border/50 shadow-2xl rounded-3xl p-6 sm:p-8 flex-grow flex flex-col">
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
                </div>

                {/* Footer Section */}
                <footer className="mt-12 pt-6 text-center text-xs text-muted-foreground flex flex-col items-center">
                    <SatyalokBadge variant="footer" />
                    <p className="mt-4">© 2026 Quiz Champ. All rights reserved.</p>
                </footer>
            </main>

            <WhatsAppHelp />
        </div>
    );
}
