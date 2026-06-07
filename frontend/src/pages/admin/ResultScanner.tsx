import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/api/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ScanLine, Loader2, ImagePlus, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
    };
  }
}

type ParsedQR = { id: string; roll: string; name?: string; batch?: string };

function parseQR(raw: string): ParsedQR | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.id || !parsed.roll || !parsed.batch) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getInitials(name = 'Participant') {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function ResultScanner() {
  const [qrCandidate, setQrCandidate] = useState<ParsedQR | null>(null);
  const [qrRaw, setQrRaw] = useState('');
  
  const [score, setScore] = useState('');
  const [rank, setRank] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const reset = () => {
    setQrCandidate(null);
    setQrRaw('');
    setScore('');
    setRank('');
    setRemarks('');
    setFile(null);
    setFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    startCamera();
  };

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error', err);
      setFeedback({ type: 'error', msg: 'Unable to access camera.' });
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!window.BarcodeDetector || !videoRef.current || qrCandidate) return;

    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    let animationFrameId: number;

    const scan = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            const parsed = parseQR(raw);
            if (parsed) {
              setQrRaw(raw);
              setQrCandidate(parsed);
              stopCamera();
              return;
            }
          }
        }
      } catch (err) {
        console.error('Scanning error:', err);
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    animationFrameId = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(animationFrameId);
  }, [qrCandidate, stopCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCandidate || !score) return;
    
    setProcessing(true);
    setFeedback(null);
    
    try {
      const formData = new FormData();
      formData.append('qrData', qrRaw);
      formData.append('score', score);
      if (rank) formData.append('rank', rank);
      if (remarks) formData.append('remarks', remarks);
      if (file) formData.append('image', file);

      const res = await adminApi.scanResult(formData);
      setFeedback({ type: 'success', msg: res.data.message });
      // Reset form but keep feedback
      setQrCandidate(null);
      setQrRaw('');
      setScore('');
      setRank('');
      setRemarks('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setFeedback(null), 5000);
      startCamera();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to submit result.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ScanLine className="size-5 text-primary" />
          Result Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Scan admit card QR and upload result.</p>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className={feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : ''}>
          {feedback.type === 'success' ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
          <AlertTitle>{feedback.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{feedback.msg}</AlertDescription>
        </Alert>
      )}

      {!qrCandidate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scan QR Code</CardTitle>
            <CardDescription>Position the QR code within the camera frame.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden border-2 border-dashed border-primary/50">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-4 border-primary/30 rounded-lg pointer-events-none m-8" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <ScanLine className="size-16 text-primary/50 animate-pulse" />
              </div>
            </div>
            {!window.BarcodeDetector && (
              <p className="mt-4 text-sm text-destructive text-center">
                Barcode Detector API not supported in your browser. Please use Chrome/Edge on Android or macOS.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enter Result</CardTitle>
            <CardDescription>Upload OMR sheet and enter marks.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
                <Avatar>
                  <AvatarFallback>{getInitials(qrCandidate.name || 'P')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{qrCandidate.name || 'Participant'}</p>
                  <p className="text-sm text-muted-foreground">{qrCandidate.roll} &bull; <Badge variant="secondary">{qrCandidate.batch}</Badge></p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score Obtained *</Label>
                <Input 
                  id="score" 
                  type="number" 
                  step="0.01"
                  required 
                  value={score} 
                  onChange={(e) => setScore(e.target.value)} 
                  placeholder="e.g. 85.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank">Rank (Optional)</Label>
                <Input 
                  id="rank" 
                  type="number" 
                  value={rank} 
                  onChange={(e) => setRank(e.target.value)} 
                  placeholder="e.g. 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Upload Answer Sheet (Optional)</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-xs text-muted-foreground">You can take a photo or upload an image.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Input 
                  id="remarks" 
                  type="text" 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)} 
                  placeholder="e.g. Excellent performance"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={reset} disabled={processing}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing || !score}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Result
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
