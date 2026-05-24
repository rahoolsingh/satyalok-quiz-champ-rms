import React, { useState, useEffect } from 'react';
import { SliderImage } from '../../types';
import { adminApi, portalApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
      <h2 className="text-xl font-bold tracking-tight mb-6">Slider Image Management</h2>
      {message && <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>}
      {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Upload New Image</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-muted-foreground text-sm">
            <span className="text-3xl">📁</span>
            <span>{uploading ? 'Uploading...' : 'Click to upload (JPEG, PNG, WebP)'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Images ({images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={img.id} className="border border-border rounded-xl overflow-hidden">
                  <img src={img.imageUrl} alt={`Slide ${i + 1}`} className="w-full h-28 object-cover" />
                  <div className="flex items-center gap-1 p-2">
                    <span className="bg-muted text-foreground text-xs font-semibold px-2 py-0.5 rounded-full mr-auto">#{i + 1}</span>
                    <Button variant="ghost" size="xs" onClick={() => move(i, 'up')} disabled={i === 0}>↑</Button>
                    <Button variant="ghost" size="xs" onClick={() => move(i, 'down')} disabled={i === images.length - 1}>↓</Button>
                    <Button variant="ghost" size="xs" onClick={() => handleDelete(img.id)} className="text-destructive">🗑</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
