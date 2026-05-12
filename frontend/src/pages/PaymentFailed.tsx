import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SatyalokBadge } from '../components/SatyalokBadge';

export function PaymentFailed() {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center gap-6 min-h-[60vh] justify-center"
        >
          <span className="text-6xl" role="img" aria-label="Payment failed">❌</span>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-2">
              Payment Unsuccessful
            </h1>
            <p className="text-[#86868b] text-sm leading-relaxed">
              Your payment could not be completed. No amount has been deducted. You can try again
              from the registration page.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            <Link
              to="/"
              className="w-full py-3 px-6 bg-[#0071e3] text-white rounded-full text-sm font-semibold text-center hover:opacity-90 transition-opacity"
            >
              Try Again
            </Link>
            <a
              href="mailto:contact@satyalok.in"
              className="w-full py-3 px-6 bg-transparent text-[#0066cc] border-2 border-[#d2d2d7] rounded-full text-sm font-medium text-center hover:border-[#0071e3] transition-colors"
            >
              Contact Support
            </a>
          </div>
        </motion.div>

        <div className="mt-8">
          <SatyalokBadge variant="footer" />
        </div>
      </div>
    </div>
  );
}
