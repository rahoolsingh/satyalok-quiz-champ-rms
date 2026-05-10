import React from 'react';
import { motion } from 'framer-motion';
import { PaymentSession } from '../types';

export function PaymentGateway({
  session,
  onFailure,
}: {
  session: PaymentSession;
  onSuccess?: never; // no longer used — success is handled by /payment-success page
  onFailure: (e: string) => void;
}) {
  const handlePay = () => {
    if (!session.redirectUrl) {
      onFailure('Payment URL is missing. Please try again.');
      return;
    }
    // Redirect the user to PhonePe via the PGS redirect URL
    window.location.href = session.redirectUrl;
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
    >
      <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase mb-2">
        Step 3 of 3
      </p>
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-2">
        Complete payment
      </h2>
      <p className="text-[#86868b] text-sm mb-8">Secure your spot at Quiz Champ 2026</p>

      <div className="border-t border-b border-[#d2d2d7] py-4 mb-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-[#86868b] text-sm">Registration Fee</span>
          <span className="text-[#1d1d1f] font-medium">₹{session.amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-[#1d1d1f]">Total</span>
          <span className="font-bold text-[#1d1d1f] text-lg">₹{session.amount}</span>
        </div>
      </div>

      <p className="text-[#86868b] text-xs text-center mb-5">🔒 Secured by PhonePe</p>

      <motion.button
        onClick={handlePay}
        whileHover={{ opacity: 0.88 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-[0.95rem] font-semibold flex items-center justify-center gap-2"
        aria-label="Pay and complete registration"
      >
        Pay ₹{session.amount} &amp; Register
      </motion.button>

      <p className="text-center text-[#86868b] text-xs mt-4">
        You will be redirected to PhonePe to complete your payment securely.
      </p>
    </motion.div>
  );
}
