import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SatyalokBadge } from '../components/SatyalokBadge';

export function PaymentFailed() {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-2xl mx-auto px-6 py-[clamp(32px,5vw,64px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center gap-6 min-h-[60vh] justify-center"
        >
          <span className="text-5xl" role="img" aria-label="Payment failed">❌</span>

          <div>
            <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-[#1d1d1f] mb-2">
              Payment unsuccessful
            </h1>
            <p className="text-[#86868b] text-sm leading-relaxed max-w-sm">
              Your payment could not be completed. No amount has been deducted. You can try again
              from the registration page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link
              to="/"
              className="flex-1 py-3 px-6 bg-[#0071e3] text-white rounded-full text-[0.95rem] font-semibold text-center hover:opacity-88 transition-opacity"
            >
              Try again
            </Link>
            <a
              href="mailto:contact@satyalok.in"
              className="flex-1 py-3 px-6 bg-transparent text-[#0066cc] border border-[#d2d2d7] rounded-full text-[0.95rem] font-medium text-center hover:border-[#0071e3] transition-colors"
            >
              Contact support
            </a>
          </div>
        </motion.div>

        <SatyalokBadge variant="footer" />
      </div>
    </div>
  );
}
