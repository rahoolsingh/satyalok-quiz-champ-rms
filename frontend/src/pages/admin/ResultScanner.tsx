import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/api/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ScanLine, Loader2, CheckCircle2, FileImage, ImagePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface RecentResult {
  id: string;
  participantId: string;
  rollNumber: string;
  score: number;
  answerSheetUrl?: string;
  participantName: string;
  batchType: string;
  participantPhotoUrl?: string;
}

export function ResultScanner() {
  const [qrCandidate, setQrCandidate] = useState<ParsedQR | null>(null);
  const [qrRaw, setQrRaw] = useState('');
  
  const [score, setScore] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [recent, setRecent] = useState<RecentResult[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [maxMarks, setMaxMarks] = useState<string>(() => localStorage.getItem('adminMaxMarks') || '100');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem('adminMaxMarks', maxMarks);
  }, [maxMarks]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const response = await adminApi.getResultsList({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRecent(response.data.results || []);
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const reset = () => {
    setQrCandidate(null);
    setQrRaw('');
    setScore('');
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

              // Pre-fill existing result if available
              try {
                const res = await adminApi.getResultsList({ search: parsed.roll, limit: 1 });
                const existing = res.data.results?.find((r: any) => r.rollNumber === parsed.roll);
                if (existing) {
                  setScore(existing.score.toString());
                }
              } catch (e) {
                // Ignore failure
              }

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
    
    if (Number(maxMarks) > 0 && Number(score) > Number(maxMarks)) {
      setFeedback({ type: 'error', msg: `Score cannot exceed the maximum marks (${maxMarks}).` });
      setProcessing(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('qrData', qrRaw);
      formData.append('score', score);
      if (file) formData.append('image', file);

      const res = await adminApi.scanResult(formData);
      setFeedback({ type: 'success', msg: res.data.message });
      
      // Refresh recent list
      loadRecent();

      // Reset form but keep feedback
      setQrCandidate(null);
      setQrRaw('');
      setScore('');
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
    <div className="grid gap-5 lg:grid-cols-2 max-w-6xl mx-auto">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ScanLine className="size-5 text-primary" />
              Result Scanner
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Scan admit card QR and upload result.</p>
          </div>
          <div className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-sm shrink-0">
            <Label htmlFor="maxMarks" className="text-sm font-medium whitespace-nowrap">Max Marks:</Label>
            <Input 
              id="maxMarks" 
              type="number" 
              value={maxMarks} 
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-20 h-8 text-center font-bold" 
              min="1"
            />
          </div>
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
              <CardContent className="space-y-6">
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
                  <Label htmlFor="score" className="text-lg">Marks Obtained <span className="text-destructive">*</span></Label>
                  <Input 
                    id="score" 
                    type="number" 
                    step="0.01"
                    required 
                    value={score} 
                    onChange={(e) => setScore(e.target.value)} 
                    placeholder="0.0"
                    className="text-4xl h-20 font-bold text-center tracking-tight"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-lg">Answer Sheet (Optional)</Label>
                  <Label 
                    htmlFor="image" 
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className={`w-10 h-10 mb-3 ${file ? 'text-emerald-500' : 'text-primary/70'}`} />
                      <p className="mb-2 text-sm text-foreground font-semibold text-center px-4 line-clamp-1">
                        {file ? file.name : "Click to upload or take photo"}
                      </p>
                      <p className="text-xs text-muted-foreground text-center px-4">
                        {file ? "Click to change image" : "JPG, PNG, WEBP allowed"}
                      </p>
                    </div>
                    <Input 
                      id="image" 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    />
                  </Label>
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

      <div className="flex flex-col gap-5">
        <Card className="flex flex-col h-full max-h-[600px]">
          <CardHeader>
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
            <CardDescription>Last 10 results submitted.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {recentLoading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : recent.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No recent submissions found.
                </div>
              ) : (
                <div className="divide-y">
                  {recent.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                      <Avatar className="size-10">
                        <AvatarImage src={record.participantPhotoUrl} />
                        <AvatarFallback>{getInitials(record.participantName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{record.participantName}</p>
                        <p className="text-xs text-muted-foreground">{record.rollNumber} &bull; {record.batchType}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{record.score}</p>
                          <p className="text-[10px] uppercase text-muted-foreground">Score</p>
                        </div>
                        {record.answerSheetUrl && (
                          <a href={record.answerSheetUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 group relative block size-10 rounded overflow-hidden border">
                            <img src={record.answerSheetUrl} alt="OMR" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileImage className="size-4 text-white" />
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
