import React from 'react';
import { motion } from 'framer-motion';
import { AdmitCardData } from '../types';

export function AdmitCard({ data, participantId }: { data: AdmitCardData; participantId?: string }) {
  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-3 mb-7">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-[#1d1d1f]">Registration successful</p>
          <p className="text-[#86868b] text-sm">Your admit card is ready</p>
        </div>
      </div>

      <div id="admit-card" className="border border-[#d2d2d7] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0071e3] px-6 py-5">
          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">Official Admit Card</p>
          <h2 className="text-white text-xl font-bold tracking-tight">{data.eventName}</h2>
        </div>

        {/* Roll number */}
        <div className="px-6 py-5 border-b border-[#d2d2d7] text-center">
          {data.photoUrl && (
            <img src={data.photoUrl} alt="Participant" className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-[#d2d2d7]" />
          )}
          <p className="text-xs font-semibold text-[#86868b] tracking-widest uppercase mb-2">Roll Number</p>
          <motion.p
            className="text-5xl font-bold tracking-[0.15em] text-[#1d1d1f]"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          >
            {data.rollNumber}
          </motion.p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2">
          {[
            { label: 'Name', value: data.name },
            { label: 'Class', value: data.class },
            { label: 'Batch', value: data.batchType },
            { label: 'Guardian', value: data.guardianName },
            { label: 'Mobile', value: data.mobileNumber },
            { label: 'Date', value: new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(({ label, value }, i) => (
            <div key={label} className={`px-6 py-3.5 ${i < 4 ? 'border-b border-[#f5f5f7]' : ''} ${i % 2 === 0 ? 'border-r border-[#f5f5f7]' : ''}`}>
              <p className="text-[0.68rem] font-medium text-[#86868b] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-[#1d1d1f]">{value}</p>
            </div>
          ))}
        </div>

        <p className="px-6 py-3 text-[#86868b] text-xs text-center border-t border-[#f5f5f7]">
          Bring this admit card on the day of the quiz. Roll number is required for entry.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => window.print()} className="flex-1 py-2.5 px-5 bg-transparent text-[#0066cc] border border-[#d2d2d7] rounded-full font-medium text-sm hover:border-[#0071e3] transition-colors">
          Print
        </button>
        {participantId && (
          <button onClick={() => window.open(`/api/registration/admit-card/${participantId}?format=html`, '_blank')} className="flex-1 py-2.5 px-5 bg-[#0071e3] text-white rounded-full font-semibold text-sm hover:opacity-88 transition-opacity">
            Download
          </button>
        )}
      </div>
    </motion.div>
  );
}
