import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

    // Open the WhatsApp group link regardless
    window.open(WHATSAPP_GROUP_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-[#d2d2d7] p-6 text-center">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-[#25D366]/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        </div>

        <h1 className="text-lg font-bold text-[#1d1d1f] mb-1">Quiz Champ 2026</h1>
        <p className="text-sm text-[#86868b] mb-6">Official WhatsApp Group</p>

        {status === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#d2d2d7] border-t-[#25D366] rounded-full animate-spin" />
          </div>
        )}

        {status === 'ready' && (
          <>
            <p className="text-sm text-[#1d1d1f] mb-4">
              Join our official WhatsApp group for event updates, reminders, and announcements.
            </p>
            <button
              onClick={handleJoin}
              className="w-full py-3 px-4 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join WhatsApp Group
            </button>
          </>
        )}

        {status === 'joined' && (
          <div className="py-4">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-sm text-green-700 font-medium">
              {name ? `Thanks ${name}!` : 'Thanks!'} Your group join has been recorded.
            </p>
            <p className="text-xs text-[#86868b] mt-2">
              The WhatsApp group should have opened in a new tab. If not, tap below:
            </p>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-[#25D366]/10 text-[#25D366] font-medium rounded-lg text-sm hover:bg-[#25D366]/20 transition-colors"
            >
              Open WhatsApp Group →
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-[#25D366] text-white font-medium rounded-xl text-sm hover:bg-[#1da851] transition-colors"
            >
              Join Group Anyway →
            </a>
          </div>
        )}

        <p className="text-[10px] text-[#86868b] mt-6">Quiz Champ 2026 · Satyalok</p>
      </div>
    </div>
  );
}
