import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdmitCardData } from '../types';
import { profileApi } from '../api/client';

export function AdmitCard({ data }: { data: AdmitCardData; participantId?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await profileApi.downloadAdmitCard();
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admit-card-${data.rollNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to download admit card';
      alert(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div 
      className="w-full" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      {/* Roll Number Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-5">
        <div className="flex items-center gap-5">
          {data.photoUrl && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                <img 
                  src={data.photoUrl} 
                  alt={data.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Your Roll Number</p>
            <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
              <p className="text-3xl font-bold text-[#0071e3] tracking-wide text-center">
                {data.rollNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-3">
          <InfoRow label="Name" value={data.name} />
          <InfoRow label="Class" value={data.class} />
          <InfoRow 
            label="Batch" 
            value={data.batchType === 'JUNIOR' ? 'Junior (Classes 1-7)' : 'Senior (Classes 8-12)'} 
          />
          <InfoRow label="Guardian" value={data.guardianName} />
          <InfoRow label="Mobile" value={`+91 ${data.mobileNumber}`} />
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Event Information</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-medium">Event:</span> {data.eventName}</p>
          <p><span className="font-medium">Date:</span> To be announced</p>
          <p><span className="font-medium">Venue:</span> To be announced</p>
          <p className="text-xs text-gray-600 mt-3">
            Check your email and WhatsApp for event updates
          </p>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-4 px-6 bg-[#0071e3] text-white rounded-xl font-semibold text-base hover:bg-[#005bb5] active:scale-98 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {downloading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Admit Card PDF</span>
          </>
        )}
      </button>

      {/* Help Text */}
      <p className="text-center text-gray-500 text-xs mt-4">
        Need help?{' '}
        <a href="mailto:support@quizchamp.com" className="text-[#0071e3] font-medium">
          Contact Support
        </a>
      </p>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
