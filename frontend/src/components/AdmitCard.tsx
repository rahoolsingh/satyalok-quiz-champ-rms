import React from 'react';
import { motion } from 'framer-motion';
import { AdmitCardData } from '../types';

export function AdmitCard({ data, participantId }: { data: AdmitCardData; participantId?: string }) {
  const handleDownload = () => {
    if (participantId) {
      window.open(`/api/registration/admit-card/${participantId}/download`, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Success Message */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <span className="text-3xl">✅</span>
        <div className="flex-1">
          <p className="font-semibold text-[#1d1d1f] text-base">Registration Successful!</p>
          <p className="text-[#86868b] text-sm">Your admit card has been sent to your email</p>
        </div>
      </div>

      {/* Admit Card */}
      <div id="admit-card" className="border-2 border-[#d2d2d7] rounded-2xl overflow-hidden shadow-sm bg-white">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#0071e3] to-[#005bb5] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-medium tracking-widest uppercase mb-1">Official Admit Card</p>
              <h2 className="text-white text-2xl font-bold tracking-tight">{data.eventName}</h2>
            </div>
            <div className="text-white text-4xl">🏆</div>
          </div>
        </div>

        {/* Photo and Roll Number Section */}
        <div className="px-6 py-6 border-b-2 border-[#f5f5f7] bg-gradient-to-b from-blue-50/30 to-transparent">
          <div className="flex items-center gap-6">
            {data.photoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={data.photoUrl} 
                  alt={data.name} 
                  className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md" 
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#86868b] tracking-widest uppercase mb-2">Roll Number</p>
              <motion.p
                className="text-4xl font-bold tracking-wider text-[#0071e3]"
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.2 }}
              >
                {data.rollNumber}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-4">
          <DetailRow label="Name" value={data.name} />
          <DetailRow label="Class" value={data.class} />
          <DetailRow label="Batch" value={data.batchType === 'JUNIOR' ? 'Junior (Classes 1-7)' : 'Senior (Classes 8-12)'} />
          <DetailRow label="Guardian" value={data.guardianName} />
          <DetailRow label="Mobile" value={data.mobileNumber} />
          <DetailRow 
            label="Issued On" 
            value={new Date(data.generatedAt).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })} 
          />
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-amber-50 border-t-2 border-amber-200">
          <p className="text-amber-900 text-xs font-medium mb-2">📋 Important Instructions:</p>
          <ul className="text-amber-800 text-xs space-y-1 ml-4 list-disc">
            <li>Bring this admit card on the day of the event</li>
            <li>Arrive 30 minutes before the scheduled time</li>
            <li>Carry a valid ID proof along with this admit card</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button 
          onClick={handlePrint} 
          className="flex-1 py-3 px-5 bg-white text-[#0071e3] border-2 border-[#0071e3] rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>🖨️</span>
          Print
        </button>
        {participantId && (
          <button 
            onClick={handleDownload} 
            className="flex-1 py-3 px-5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
          >
            <span>📥</span>
            Download PDF
          </button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-center text-[#86868b] text-xs mt-4">
        Need help? Contact us at <a href="mailto:support@quizchamp.com" className="text-[#0071e3] font-medium">support@quizchamp.com</a>
      </p>
    </motion.div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#f5f5f7] last:border-0">
      <span className="text-sm text-[#86868b] font-medium">{label}</span>
      <span className="text-sm text-[#1d1d1f] font-semibold">{value}</span>
    </div>
  );
}
