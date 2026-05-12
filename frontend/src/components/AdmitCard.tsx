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

      {/* WhatsApp Group Card */}
      <div className="bg-green-50 rounded-xl border border-green-200 p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Join Quiz Updates Group</h3>
            <p className="text-xs text-gray-600 mb-3">
              Get latest updates, announcements, and important information about the quiz competition
            </p>
            <a
              href="https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20BA5A] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join WhatsApp Group
            </a>
          </div>
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
        <a href="mailto:contact@satyalok.in" className="text-[#0071e3] font-medium">
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
