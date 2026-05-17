import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { BatchType, RegistrationInput } from "../types";
import { registrationApi } from "../api/client";

// --- Types ---
type FormState = Omit<RegistrationInput, "gender"> & { gender: RegistrationInput["gender"] | "" };
type Errors = Partial<Record<keyof FormState, string>>;

interface Draft extends Partial<RegistrationInput> {
    participantId?: string;
    photoUrl?: string;
    paymentStatus?: string;
    merchantTransactionId?: string;
}

interface Props {
    batchType: BatchType;
    mobileNumber: string;
    sessionToken: string;
    draft?: Draft | null;
    onSuccess: (paymentSession: {
        redirectUrl: string;
        amount: number;
        participantId: string;
        merchantTransactionId: string;
        currency: string;
        provider: string;
    }) => void;
    onBack: () => void;
}

// --- Canvas Utility for Cropping ---
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Canvas is empty"));
                    return;
                }
                // Convert Blob to File to maintain compatibility with FormData
                const file = new File([blob], "admit_card_photo.jpg", {
                    type: "image/jpeg",
                });
                resolve(file);
            },
            "image/jpeg",
            0.95,
        );
    });
}

// --- UI Components ---
const FieldWrapper = ({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="mb-5">
        <label className="block text-sm font-semibold text-[#1d1d1f] mb-2">
            {label}{" "}
            {required && (
                <span className="text-red-500" aria-hidden="true">
                    *
                </span>
            )}
        </label>
        {children}
        <AnimatePresence>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-sm mt-1.5 font-medium"
                    role="alert"
                >
                    {error}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

// --- Main Component ---
export function RegistrationForm({
    batchType,
    mobileNumber,
    sessionToken,
    draft,
    onSuccess,
    onBack,
}: Props) {
    const [form, setForm] = useState<FormState>({
        name: draft?.name || "",
        class: draft?.class || "",
        batchType,
        gender: draft?.gender || "",
        guardianName: draft?.guardianName || "",
        address: draft?.address || "",
        mobileNumber,
        email: draft?.email || "",
        referralSource: draft?.referralSource || "",
    });

    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState("");

    // Photo & Cropper State
    const fileRef = useRef<HTMLInputElement>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        draft?.photoUrl || null,
    );
    const [photoError, setPhotoError] = useState("");

    // Cropper Modal State
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const updateForm = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const validate = (): boolean => {
        const errs: Errors = {};
        if (!form.name.trim()) errs.name = "Full name is required";
        if (!form.class.trim()) errs.class = "Class is required";
        if (!form.gender) errs.gender = "Gender is required";
        if (!form.guardianName.trim())
            errs.guardianName = "Guardian name is required";
        if (!form.address.trim()) errs.address = "Full address is required";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = "Enter a valid email address";

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // --- Photo Handlers ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (
            !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
                file.type,
            )
        ) {
            setPhotoError("Accepted formats: JPEG, PNG, WebP");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setPhotoError("Photo must be under 5 MB"); // Increased initial allowance since we will compress it during crop
            return;
        }

        setPhotoError("");
        const reader = new FileReader();
        reader.onload = () => {
            setImageToCrop(reader.result as string);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input so the same file can be selected again if cancelled
        if (fileRef.current) fileRef.current.value = "";
    };

    const onCropComplete = useCallback(
        (_croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        [],
    );

    const handleSaveCrop = async () => {
        if (!imageToCrop || !croppedAreaPixels) return;
        try {
            const croppedFile = await getCroppedImg(
                imageToCrop,
                croppedAreaPixels,
            );
            setPhotoFile(croppedFile);
            setPhotoPreview(URL.createObjectURL(croppedFile));
            setIsCropModalOpen(false);
            setImageToCrop(null);
        } catch (e) {
            setPhotoError("Failed to crop image. Please try again.");
        }
    };

    // --- Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            // Scroll to top to show errors
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSubmitting(true);
        setServerError("");

        try {
            const fd = new FormData();
            fd.append("name", form.name.trim());
            fd.append("class", form.class.trim());
            fd.append("batchType", form.batchType);
            fd.append("gender", form.gender);
            fd.append("guardianName", form.guardianName.trim());
            fd.append("address", form.address.trim());
            fd.append("mobileNumber", mobileNumber);
            if (form.email) fd.append("email", form.email.trim());
            if (form.referralSource)
                fd.append("referralSource", form.referralSource.trim());
            if (photoFile) fd.append("photo", photoFile);

            await registrationApi.saveDraft(fd, sessionToken);
            const payRes = await registrationApi.initiatePayment(sessionToken);
            onSuccess(payRes.data);
        } catch (err: any) {
            setServerError(
                err?.response?.data?.error ||
                    "Registration failed. Please try again or contact support.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
        >
            <header className="mb-8">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={submitting}
                    className="text-[#0071e3] text-[15px] font-medium mb-7 flex items-center gap-1.5 hover:opacity-70 transition-opacity disabled:opacity-40"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-[#0071e3]/8 rounded-full text-[12px] font-semibold text-[#0071e3] tracking-wide">
                        Step 3 of 3
                    </span>
                    {draft && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full text-[12px] font-semibold text-green-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Draft loaded
                        </span>
                    )}
                </div>
                <h2 className="text-[26px] font-bold tracking-tight text-[#1d1d1f] leading-tight mb-2">
                    Registration details
                </h2>
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f5f5f7] rounded-[12px] mt-4 border border-[#e8e8ed]">
                    <div className={`w-2.5 h-2.5 rounded-full ${batchType === 'JUNIOR' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <span className="text-[14px] font-medium text-[#1d1d1f]">
                        {batchType === "JUNIOR" ? "Junior Batch (Class 5-10)" : "Senior Batch (Class 10+)"}
                    </span>
                </div>
            </header>

            <AnimatePresence>
                {serverError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
                        role="alert"
                    >
                        {serverError}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Photo Upload Section */}
                <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl">
                    <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                        Admit Card Photo
                    </label>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="relative shrink-0 w-20 h-24 sm:w-24 sm:h-28 bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Admit Card Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={submitting}
                                className="px-5 py-2.5 bg-white border border-gray-300 hover:border-[#0071e3] hover:text-[#0071e3] rounded-xl text-sm font-semibold text-[#1d1d1f] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {photoPreview ? "Change Photo" : "Upload Photo"}
                            </button>
                            <p className="text-sm text-gray-500 mt-2">
                                Required for admit card. (Max 5MB)
                            </p>
                            {photoError && (
                                <p className="text-red-500 text-sm mt-1.5 font-medium">
                                    {photoError}
                                </p>
                            )}
                        </div>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-hidden="true"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldWrapper
                        label="Full Name"
                        error={errors.name}
                        required
                    >
                        <input
                            value={form.name}
                            onChange={(e) => updateForm("name", e.target.value)}
                            placeholder="Student's name"
                            disabled={submitting}
                            className={`w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border ${errors.name ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                        />
                    </FieldWrapper>
                    <FieldWrapper label="Class" error={errors.class} required>
                        <input
                            value={form.class}
                            onChange={(e) =>
                                updateForm("class", e.target.value)
                            }
                            placeholder="e.g. Class 8"
                            disabled={submitting}
                            className={`w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border ${errors.class ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                        />
                    </FieldWrapper>
                    <FieldWrapper label="Gender" error={errors.gender} required>
                        <select
                            value={form.gender || ""}
                            onChange={(e) => updateForm("gender", e.target.value)}
                            disabled={submitting}
                            className={`w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border ${errors.gender ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                        >
                            <option value="">Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </FieldWrapper>
                    <FieldWrapper
                        label="Guardian Name"
                        error={errors.guardianName}
                        required
                    >
                        <input
                            value={form.guardianName}
                            onChange={(e) =>
                                updateForm("guardianName", e.target.value)
                            }
                            placeholder="Parent/Guardian"
                            disabled={submitting}
                            className={`w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border ${errors.guardianName ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                        />
                    </FieldWrapper>
                    <FieldWrapper label="Mobile Number">
                        <input
                            value={mobileNumber}
                            disabled
                            className="w-full px-4 py-3 bg-gray-50 text-gray-500 font-medium rounded-xl text-base border border-gray-200 cursor-not-allowed"
                        />
                    </FieldWrapper>
                </div>

                <FieldWrapper label="Address" error={errors.address} required>
                    <textarea
                        value={form.address}
                        onChange={(e) => updateForm("address", e.target.value)}
                        placeholder="Full residential address"
                        disabled={submitting}
                        className={`w-full h-24 px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base resize-y outline-none transition-all border ${errors.address ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                    />
                </FieldWrapper>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FieldWrapper
                        label="Email Address"
                        error={errors.email}
                    >
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                updateForm("email", e.target.value)
                            }
                            placeholder="For backup communication"
                            disabled={submitting}
                            className={`w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border ${errors.email ? "border-red-400 focus:ring-4 focus:ring-red-500/20" : "border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20"}`}
                        />
                    </FieldWrapper>
                    <FieldWrapper label="How did you hear about us?">
                        <select
                            value={form.referralSource}
                            onChange={(e) =>
                                updateForm("referralSource", e.target.value)
                            }
                            disabled={submitting}
                            className="w-full px-4 py-3 bg-white text-[#1d1d1f] rounded-xl text-base outline-none transition-all border border-gray-300 focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/20 cursor-pointer"
                        >
                            <option value="">Select an option</option>
                            {[
                                "Social Media",
                                "Friend / Family",
                                "School",
                                "Newspaper",
                                "Other",
                            ].map((o) => (
                                <option key={o} value={o}>
                                    {o}
                                </option>
                            ))}
                        </select>
                    </FieldWrapper>
                </div>

                <div className="pt-4">
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 px-6 bg-[#0071e3] hover:bg-[#005bb5] text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-md"
                    >
                        {submitting ? (
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
                                </svg>{" "}
                                Saving details...
                            </>
                        ) : (
                            "Save & Proceed to Payment \u2192"
                        )}
                    </motion.button>
                </div>
            </form>

            {/* --- Cropper Modal Overlay --- */}
            <AnimatePresence>
                {isCropModalOpen && imageToCrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">
                                        Crop Photo
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Drag to position, pinch to zoom
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCropModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="relative w-full h-[60vh] sm:h-[400px] bg-gray-900">
                                <Cropper
                                    image={imageToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={100 / 125} // Strict 4:5 aspect ratio enforced here
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    showGrid={true}
                                />
                            </div>

                            <div className="p-5 bg-white z-10 flex gap-3">
                                <button
                                    onClick={() => setIsCropModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCrop}
                                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-[#0071e3] hover:bg-[#005bb5] transition-colors shadow-md"
                                >
                                    Crop & Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
