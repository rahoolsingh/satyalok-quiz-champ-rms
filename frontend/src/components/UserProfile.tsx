import React from 'react';
import { motion } from 'framer-motion';
import { ProfileData } from '../types';
import { AdmitCard } from './AdmitCard';

interface UserProfileProps {
  profile: ProfileData;
  onLogout: () => void;
  onCompletePayment?: () => void;
}

export function UserProfile({ profile, onLogout, onCompletePayment }: UserProfileProps) {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#d2d2d7]">
        <div>
          <p className="text-xs font-semibold text-[#0071e3] tracking-[0.1em] uppercase">
            My Profile
          </p>
          <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold tracking-tight text-[#1d1d1f]">
            {profile.name}
          </h1>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-[#ef4444] hover:opacity-75 transition-opacity font-medium"
        >
          Logout
        </button>
      </div>

      {/* Payment Status Card */}
      <PaymentStatusCard
        status={profile.paymentStatus}
        amount={profile.paymentAmount}
        merchantTransactionId={profile.merchantTransactionId}
        onCompletePayment={onCompletePayment}
      />

      {/* Admit Card (if completed) */}
      {profile.paymentStatus === 'COMPLETED' && profile.admitCard && (
        <div className="mt-6">
          <AdmitCard data={profile.admitCard} participantId={profile.participantId} />
        </div>
      )}

      {/* Personal Details Section */}
      {profile.paymentStatus !== 'COMPLETED' && (
        <div className="mt-6 bg-white border border-[#d2d2d7] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#1d1d1f] mb-4">Personal Details</h2>
          <div className="space-y-3">
            <DetailRow label="Name" value={profile.name} />
            <DetailRow label="Class" value={profile.class} />
            <DetailRow
              label="Batch"
              value={profile.batchType === 'JUNIOR' ? 'Junior (Classes 1-7)' : 'Senior (Classes 8-12)'}
            />
            <DetailRow label="Guardian" value={profile.guardianName} />
            <DetailRow label="Mobile" value={profile.mobileNumber} />
            {profile.email && <DetailRow label="Email" value={profile.email} />}
            <DetailRow label="Address" value={profile.address} />
            <DetailRow
              label="Registered On"
              value={new Date(profile.registeredAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 text-center">
        <p className="text-[#86868b] text-xs">
          Need help?{' '}
          <a href="mailto:support@quizchamp.com" className="text-[#0071e3] font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </motion.div>
  );
}

// Payment Status Card Component
function PaymentStatusCard({
  status,
  amount,
  merchantTransactionId,
  onCompletePayment,
}: {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount?: number;
  merchantTransactionId?: string;
  onCompletePayment?: () => void;
}) {
  if (status === 'COMPLETED') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">✅</span>
          <div className="flex-1">
            <p className="font-bold text-[#1d1d1f] text-lg">Registration Complete!</p>
            <p className="text-[#86868b] text-sm">Your payment was successful</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⏳</span>
          <div className="flex-1">
            <p className="font-bold text-[#1d1d1f] text-lg">Payment Pending</p>
            <p className="text-[#86868b] text-sm">Complete your payment to secure your spot</p>
          </div>
        </div>

        {amount && (
          <div className="mb-3 p-3 bg-white rounded-lg">
            <p className="text-xs text-[#86868b] mb-1">Amount Due</p>
            <p className="text-2xl font-bold text-[#1d1d1f]">₹{amount}</p>
            {merchantTransactionId && (
              <p className="text-xs text-[#86868b] mt-1">
                Transaction ID: {merchantTransactionId.slice(0, 16)}...
              </p>
            )}
          </div>
        )}

        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-3">
          <p className="text-xs text-amber-900 font-medium">⚠️ Important</p>
          <p className="text-xs text-amber-800 mt-1">
            Please do not make duplicate payments. Complete your existing payment to proceed.
          </p>
        </div>

        {onCompletePayment && (
          <button
            onClick={onCompletePayment}
            className="w-full py-3 px-5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Complete Payment →
          </button>
        )}
      </div>
    );
  }

  // FAILED status
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">❌</span>
        <div className="flex-1">
          <p className="font-bold text-[#1d1d1f] text-lg">Payment Failed</p>
          <p className="text-[#86868b] text-sm">Your previous payment attempt was unsuccessful</p>
        </div>
      </div>

      <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
        <p className="text-sm text-[#1d1d1f] mb-2">What happened?</p>
        <p className="text-xs text-[#86868b]">
          Your payment could not be processed. This might be due to insufficient funds, network
          issues, or payment gateway errors.
        </p>
      </div>

      {onCompletePayment && (
        <button
          onClick={onCompletePayment}
          className="w-full py-3 px-5 bg-[#ef4444] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Retry Payment →
        </button>
      )}
    </div>
  );
}

// Detail Row Component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-[#f5f5f7] last:border-0">
      <span className="text-sm text-[#86868b] font-medium">{label}</span>
      <span className="text-sm text-[#1d1d1f] font-semibold text-right max-w-[60%]">{value}</span>
    </div>
  );
}
