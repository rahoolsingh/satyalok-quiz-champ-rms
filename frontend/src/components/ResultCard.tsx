import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { ProfileData, PortalStatus } from '../types';

interface ResultCardProps {
  profile: ProfileData;
  portalStatus?: PortalStatus | null;
}

export function ResultCard({ profile, portalStatus }: ResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Result-${profile.rollNumber || profile.name}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Failed to download image', error);
      alert('Failed to download result image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const result = profile.result;
  const photoUrl = profile.photoUrl
    ? `${profile.photoUrl}${profile.photoUrl.includes('?') ? '&' : '?'}t=${profile.rollNumber || '1'}`
    : undefined;

  if (!result) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5">
        <p className="font-bold text-yellow-900 text-lg">Result Pending</p>
        <p className="text-yellow-800 text-sm mt-1">
          Your result has not been generated yet. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        ref={cardRef} 
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-5 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-[#0071e3] opacity-10 rounded-t-xl z-0"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-bl-full opacity-5 z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center border-b border-gray-100 pb-5 mb-5">
          <h2 className="text-2xl font-bold text-[#0071e3] uppercase tracking-wider mb-1 text-center">
            {portalStatus?.prizeDistributionVenue ? "Quiz Champ 2026" : "Quiz Champ 2026"}
          </h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-4">
            Statement of Marks
          </p>
          
          <div className="flex w-full items-center gap-5 mt-2">
            {photoUrl && (
              <div className="flex-shrink-0">
                <div className="w-24 h-28 rounded-md overflow-hidden border-2 border-gray-200 shadow-sm bg-white">
                  <img 
                    src={photoUrl} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1 grid grid-cols-1 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-semibold">Name of Candidate</span>
                <span className="text-lg font-bold text-gray-800 uppercase leading-tight">{profile.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-semibold">Roll Number</span>
                <span className="text-md font-semibold text-gray-700 leading-tight">{profile.rollNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase font-medium">Guardian's Name</span>
              <span className="font-semibold text-gray-800">{profile.guardianName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase font-medium">Class / Batch</span>
              <span className="font-semibold text-gray-800">{profile.class} / {profile.batchType}</span>
            </div>
            {profile.gender && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase font-medium">Gender</span>
                <span className="font-semibold text-gray-800 capitalize">{profile.gender.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 bg-gray-50 rounded-xl border border-gray-200 p-5 mb-2">
          <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Performance Details
          </h3>
          
          <div className="space-y-4 mb-5">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-4xl font-bold text-[#0071e3]">{result.score}</span>
              <span className="text-[11px] text-gray-500 uppercase font-bold mt-1 text-center">Marks Obtained</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-green-200 shadow-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
                <span className="text-2xl font-bold text-green-600">{result.positiveMarks || 0}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 text-center">Correct Answers</span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-red-200 shadow-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500"></div>
                <span className="text-2xl font-bold text-red-600">{result.negativeMarks || 0}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 text-center">Incorrect Answers</span>
              </div>
            </div>
          </div>

          {result.rank !== undefined && (
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-3 bg-yellow-100 border border-yellow-300 px-6 py-3 rounded-full shadow-sm">
                <span className="text-xl">🏆</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-yellow-800 uppercase tracking-wider">Rank</span>
                  <span className="text-xl font-black text-yellow-900 leading-none">#{result.rank}</span>
                </div>
              </div>
            </div>
          )}
          
          {result.remarks && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 text-center font-medium italic border border-blue-100">
              "{result.remarks}"
            </div>
          )}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-[10px] text-gray-400 font-medium">
            This is a computer generated result and does not require a physical signature.
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-4 px-6 bg-[#0071e3] text-white rounded-xl font-semibold text-base hover:bg-[#005bb5] active:scale-98 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-5"
      >
        {downloading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generating Image...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Result Image</span>
          </>
        )}
      </button>

      {/* Support Contacts */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Support</h3>
        <p className="text-xs text-gray-500 mb-3">If you have any queries regarding your result, please contact us.</p>
        <div className="space-y-3">
          {portalStatus?.whatsappSupportNumber && (
            <a
              href={`https://wa.me/91${portalStatus.whatsappSupportNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[#25D366]/5 rounded-lg hover:bg-[#25D366]/10 transition-colors border border-[#25D366]/20"
            >
              <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {portalStatus.whatsappSupportName || 'WhatsApp Support'}
                </p>
                <p className="text-xs text-gray-500">+91 {portalStatus.whatsappSupportNumber}</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
