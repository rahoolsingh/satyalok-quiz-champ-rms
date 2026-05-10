import React, { useState, useEffect } from 'react';
import { SliderImage } from '../../types';
import { adminApi, portalApi } from '../../api/client';

export function SliderManager() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadImages = async () => {
    try {
      const res = await portalApi.getSliderImages();
      setImages(res.data);
    } catch {
      setError('Failed to load images');
    }
  };

  useEffect(() => { loadImages(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      await adminApi.uploadSlider(formData);
      setMessage('Image uploaded successfully');
      await loadImages();
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await adminApi.deleteSlider(id);
      setMessage('Image deleted');
      await loadImages();
    } catch {
      setError('Failed to delete image');
    }
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newImages.length) return;
    [newImages[index], newImages[swapIdx]] = [newImages[swapIdx], newImages[index]];
    const order = newImages.map((img, i) => ({ id: img.id, displayOrder: i }));
    try {
      await adminApi.reorderSlider(order);
      setImages(newImages.map((img, i) => ({ ...img, displayOrder: i })));
      setMessage('Order updated');
    } catch {
      setError('Failed to reorder images');
    }
  };

  return (
    <div>
      <h2 style={styles.heading}>Slider Image Management</h2>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Upload New Image</h3>
        <label style={styles.uploadLabel} aria-label="Upload slider image">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          <span style={styles.uploadIcon}>📁</span>
          <span>{uploading ? 'Uploading...' : 'Click to upload (JPEG, PNG, WebP)'}</span>
        </label>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Current Slider Images ({images.length})</h3>
        {images.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No images uploaded yet.</p>
        ) : (
          <div style={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={img.id} style={styles.imageCard}>
                <img src={img.imageUrl} alt={`Slide ${i + 1}`} style={styles.thumbnail} />
                <div style={styles.imageActions}>
                  <span style={styles.orderBadge}>#{i + 1}</span>
                  <button style={styles.iconBtn} onClick={() => moveImage(i, 'up')} disabled={i === 0} aria-label="Move up">↑</button>
                  <button style={styles.iconBtn} onClick={() => moveImage(i, 'down')} disabled={i === images.length - 1} aria-label="Move down">↓</button>
                  <button style={{ ...styles.iconBtn, color: '#dc2626' }} onClick={() => handleDelete(img.id)} aria-label="Delete image">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#1a237e', marginBottom: '24px' },
  success: { background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '16px' },
  uploadLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '32px', border: '2px dashed #d1d5db', borderRadius: '10px', cursor: 'pointer', color: '#6b7280' },
  uploadIcon: { fontSize: '2rem' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  imageCard: { border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
  thumbnail: { width: '100%', height: '120px', objectFit: 'cover' },
  imageActions: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px' },
  orderBadge: { background: '#1a237e', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', marginRight: 'auto' },
  iconBtn: { background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px', borderRadius: '4px' },
};
