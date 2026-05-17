import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api/client';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';

export function GroupJoin() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const [status, setStatus] = useState<'loading' | 'ready' | 'joined' | 'error'>('loading');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setStatus('error');
      setError('Invalid link. No participant ID found.');
      return;
    }
    setStatus('ready');
  }, [uid]);

  const handleJoin = async () => {
    if (!uid) return;

    try {
      const res = await api.post(`/registration/group-joined/${uid}`);
      setName(res.data.name || '');
      setStatus('joined');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setError(msg);
      setStatus('error');
    }

    window.open(WHATSAPP_GROUP_URL, '_blank');
  };

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfd] flex items-center justify-center p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[380px]"
      >
        <div className="bg-white rounded-[20px] shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-[#e8e8ed] overflow-hidden">
          {/* Header gradient strip */}
          <div className="h-1 bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#075E54]" />

          <div className="px-7 pt-8 pb-7">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-[72px] h-[72px] bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-[18px] flex items-center justify-center shadow-[0_4px_12px_rgba(37,211,102,0.3)]">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-[22px] font-bold tracking-tight text-[#1d1d1f] mb-1">
                Quiz Champ 2026
              </h1>
              <p className="text-[15px] text-[#86868b]">Official Updates Group</p>
            </div>

            {/* Content */}
            {status === 'loading' && (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-[2.5px] border-[#e8e8ed] border-t-[#25D366] rounded-full animate-spin" />
              </div>
            )}

            {status === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[15px] text-[#424245] text-center leading-relaxed mb-7">
                  Join our official WhatsApp group for event updates, schedule changes, and important announcements.
                </p>

                <motion.button
                  onClick={handleJoin}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-[14px] px-5 bg-[#25D366] text-white font-semibold text-[16px] rounded-[14px] hover:bg-[#1ebe5b] active:bg-[#19a94f] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(37,211,102,0.25)]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join WhatsApp Group
                </motion.button>

                <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-[#86868b]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure · No spam · Only updates</span>
                </div>
              </motion.div>
            )}

            {status === 'joined' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-100">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[17px] font-semibold text-[#1d1d1f] mb-1">
                  {name ? `Welcome, ${name}!` : 'You\u2019re all set!'}
                </p>
                <p className="text-[14px] text-[#86868b] mb-5">
                  Group should open in a new tab.
                </p>
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-medium text-[#25D366] bg-[#25D366]/8 rounded-full hover:bg-[#25D366]/15 transition-colors"
                >
                  Open Group →
                </a>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-amber-100">
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-[14px] text-[#86868b] mb-5">{error}</p>
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-[12px] bg-[#25D366] text-white font-semibold text-[15px] rounded-[12px] hover:bg-[#1ebe5b] transition-colors"
                >
                  Join Group Anyway →
                </a>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#86868b] mt-5 tracking-wide">
          Quiz Champ 2026 · Satyalok - A New Hope
        </p>
      </motion.div>
    </div>
  );
}
