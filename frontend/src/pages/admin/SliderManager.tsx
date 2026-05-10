import React, { useState, useEffect } from 'react';
import { SliderImage } from '../../types';
import { adminApi, portalApi } from '../../api/client';

export function SliderManager() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => { try { const r = await portalApi.getSliderImages(); setImages(r.data); } catch { setError('Failed to load images'); } };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) { setError('Only JPEG, PNG, and WebP allowed'); return; }
    setUploading(true); setError(''); setMessage('');
    const fd = new FormData(); fd.append('image', file);
    try { await adminApi.uploadSlider(fd); setMessage('Image uploaded'); await load(); }
    catch { setError('Failed to upload image'); } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try { await adminApi.deleteSlider(id); setMessage('Image deleted'); await load(); }
    catch { setError('Failed to delete image'); }
  };

  const move = async (i: number, dir: 'up' | 'down') => {
    const arr = [...images]; const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    try { await adminApi.reorderSlider(arr.map((img, idx) => ({ id: img.id, displayOrder: idx }))); setImages(arr.map((img, idx) => ({ ...img, displayOrder: idx }))); }
    catch { setError('Failed to reorder'); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Slider Image Management</h2>
      {message && <p className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm mb-4">{message}</p>}
      {error && <p className="bg-red-50 border border-red-200 text-[#ef4444] px-4 py-2.5 rounded-lg text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl p-6 mb-4 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-3">Upload New Image</h3>
        <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-[#d2d2d7] rounded-xl cursor-pointer hover:border-[#0071e3] transition-colors text-[#86868b] text-sm">
          <span className="text-3xl">📁</span>
          <span>{uploading ? 'Uploading…' : 'Click to upload (JPEG, PNG, WebP)'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#d2d2d7]">
        <h3 className="font-semibold text-[#1d1d1f] mb-4">Current Images ({images.length})</h3>
        {images.length === 0
          ? <p className="text-[#86868b] text-sm">No images uploaded yet.</p>
          : <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={img.id} className="border border-[#d2d2d7] rounded-xl overflow-hidden">
                  <img src={img.imageUrl} alt={`Slide ${i + 1}`} className="w-full h-28 object-cover" />
                  <div className="flex items-center gap-1 p-2">
                    <span className="bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold px-2 py-0.5 rounded-full mr-auto">#{i + 1}</span>
                    <button onClick={() => move(i, 'up')} disabled={i === 0} className="text-sm px-1.5 disabled:opacity-30" aria-label="Move up">↑</button>
                    <button onClick={() => move(i, 'down')} disabled={i === images.length - 1} className="text-sm px-1.5 disabled:opacity-30" aria-label="Move down">↓</button>
                    <button onClick={() => handleDelete(img.id)} className="text-sm px-1.5 text-[#ef4444]" aria-label="Delete">🗑</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
