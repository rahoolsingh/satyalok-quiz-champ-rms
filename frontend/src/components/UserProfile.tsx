import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ProfileData, PortalStatus } from '../types';
import { AdmitCard } from './AdmitCard';
import { profileApi } from '../api/client';

interface UserProfileProps {
  profile: ProfileData;
  portalStatus?: PortalStatus | null;
  onLogout: () => void;
  onCompletePayment?: () => void;
  onProfileUpdate?: (profile: ProfileData) => void;
}

export function UserProfile({ profile, portalStatus, onLogout, onCompletePayment, onProfileUpdate }: UserProfileProps) {
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkMessage, setCheckMessage] = useState('');

  const handleCheckPendingPayments = async () => {
    setCheckingPayment(true);
    setCheckMessage('');
    try {
      const response = await profileApi.checkPendingPayments();
      const { updatedCount, profile: updatedProfile } = response.data;
      
      if (updatedCount > 0) {
        setCheckMessage(`✅ Payment status updated! Found ${updatedCount} completed payment(s).`);
        if (updatedProfile && onProfileUpdate) {
          onProfileUpdate(updatedProfile);
        }
      } else {
        setCheckMessage('No payment updates found. Your payment may still be processing.');
      }
    } catch (error: any) {
      setCheckMessage(error.response?.data?.error || 'Failed to check payment status');
    } finally {
      setCheckingPayment(false);
    }
  };

  const isEventCompleted = React.useMemo(() => {
    if (!portalStatus?.eventDate) return false;
    
    try {
        const dateObj = new Date(portalStatus.eventDate);
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const eventDateStr = `${year}-${month}-${day}`;
        
        let hours = 23;
        let minutes = 59;
        
        if (portalStatus.examTime) {
            const match = portalStatus.examTime.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
            if (match) {
                let h = parseInt(match[1], 10);
                const m = parseInt(match[2] || "0", 10);
                const ampm = (match[3] || "").toUpperCase();
                if (ampm === "PM" && h < 12) h += 12;
                if (ampm === "AM" && h === 12) h = 0;
                hours = h;
                minutes = m;
                // Add 3 hours for exam duration
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
  }, [portalStatus?.eventDate, portalStatus?.examTime]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Debug info - remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <p>Payment Status: {profile.paymentStatus}</p>
          <p>Roll Number: {profile.rollNumber || 'Not assigned'}</p>
          <p>Has Admit Card: {profile.admitCard ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Admit Card (if completed) - Show this FIRST */}
      {profile.paymentStatus === 'COMPLETED' && profile.admitCard ? (
        <div className="mt-0">
          {isEventCompleted ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🏆</span>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-lg">Exam Concluded Successfully!</p>
                  <p className="text-blue-800 text-sm mt-1">
                    {portalStatus?.resultPublicationDate 
                      ? `Please wait for the result announcement on ${new Date(portalStatus.resultPublicationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`
                      : 'Please wait for the result announcement date to be declared.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AdmitCard data={profile.admitCard} participantId={profile.participantId} portalStatus={portalStatus} />
          )}
        </div>
      ) : profile.paymentStatus === 'COMPLETED' && !profile.admitCard ? (
        /* Show success message if completed but no admit card yet */
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✅</span>
            <div className="flex-1">
              <p className="font-bold text-[#1d1d1f] text-lg">Registration Complete!</p>
              <p className="text-[#86868b] text-sm">Your payment was successful. Your admit card is being generated...</p>
            </div>
          </div>
        </div>
      ) : (
        /* Show payment status card for pending/failed */
        <>
          <PaymentStatusCard
            status={profile.paymentStatus}
            amount={profile.paymentAmount}
            merchantTransactionId={profile.merchantTransactionId}
            onCompletePayment={onCompletePayment}
            onCheckPendingPayments={handleCheckPendingPayments}
            checkingPayment={checkingPayment}
            checkMessage={checkMessage}
          />

          {/* Personal Details Section */}
          <div className="mt-6 bg-white border border-[#d2d2d7] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#1d1d1f] mb-4">Personal Details</h2>
            <div className="space-y-3">
              <DetailRow label="Name" value={profile.name} />
              <DetailRow label="Class" value={profile.class} />
              <DetailRow
                label="Batch"
                value={profile.batchType === 'JUNIOR' ? 'Junior Batch (5-10)' : 'Senior Batch (10+)'}
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
        </>
      )}
    </motion.div>
  );
}

// Payment Status Card Component
function PaymentStatusCard({
  status,
  amount,
  merchantTransactionId,
  onCompletePayment,
  onCheckPendingPayments,
  checkingPayment,
  checkMessage,
}: {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount?: number;
  merchantTransactionId?: string;
  onCompletePayment?: () => void;
  onCheckPendingPayments?: () => void;
  checkingPayment?: boolean;
  checkMessage?: string;
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

        {checkMessage && (
          <div className={`rounded-lg p-3 mb-3 text-xs ${
            checkMessage.includes('✅') 
              ? 'bg-green-100 border border-green-300 text-green-900' 
              : 'bg-blue-100 border border-blue-300 text-blue-900'
          }`}>
            {checkMessage}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {onCompletePayment && (
            <button
              onClick={onCompletePayment}
              className="w-full py-3 px-5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Complete Payment →
            </button>
          )}
          
          {onCheckPendingPayments && (
            <button
              onClick={onCheckPendingPayments}
              disabled={checkingPayment}
              className="w-full py-2.5 px-5 bg-white text-[#0071e3] border-2 border-[#0071e3] rounded-full font-medium text-sm hover:bg-[#0071e3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingPayment ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                '🔄 Check Payment Status'
              )}
            </button>
          )}
        </div>
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
