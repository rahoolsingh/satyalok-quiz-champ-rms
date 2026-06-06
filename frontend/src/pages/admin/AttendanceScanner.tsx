import { useCallback, useEffect, useRef, useState } from 'react';
import { attendanceApi } from '@/api/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CheckCircle2, Clock, Keyboard, Loader2, RotateCcw, ScanLine, ShieldAlert, XCircle } from 'lucide-react';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
    };
  }
}

type Mode = 'scan' | 'manual';
type BatchType = 'JUNIOR' | 'SENIOR';
type FeedbackType = 'success' | 'error' | 'duplicate';

interface ParsedQR {
  id: string;
  roll: string;
  name?: string;
  class?: string;
  batch?: BatchType;
  mobile?: string;
}

type QRAttendanceState = 'loading' | 'eligible' | 'already_marked' | 'error';

interface QRCandidate {
  raw: string;
  parsed: ParsedQR;
  attendanceState: QRAttendanceState;
  existingAttendance?: {
    checkInTime?: string;
  };
}

interface AttendanceResult {
  name: string;
  rollNumber: string;
  class: string;
  batchType: BatchType;
  photoUrl?: string;
  checkInTime?: string;
  message: string;
}

interface Feedback {
  type: FeedbackType;
  title: string;
  message: string;
  participant?: AttendanceResult;
}

interface RecentAttendance {
  attendanceId?: string;
  participantId: string;
  rollNumber: string;
  name: string;
  class: string;
  batchType: BatchType;
  photoUrl?: string;
  checkInTime?: string;
  scanMethod?: 'QR' | 'MANUAL';
}

function getInitials(name = 'Participant') {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function parseQR(raw: string): ParsedQR | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.id || !parsed.roll || !parsed.batch) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

export function AttendanceScanner() {
  const [mode, setMode] = useState<Mode>('scan');
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [manualRoll, setManualRoll] = useState('');
  const [qrCandidate, setQrCandidate] = useState<QRCandidate | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [recent, setRecent] = useState<RecentAttendance[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setFeedback(null);
    setQrCandidate(null);
    setProcessing(false);
    lastScanRef.current = '';
  }, []);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const response = await attendanceApi.getList({
        status: 'PRESENT',
        sortBy: 'checkInTime',
        sortOrder: 'desc',
        page: 1,
        limit: 10,
      });
      setRecent(response.data.records || []);
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const showApiError = useCallback((err: any) => {
    const data = err.response?.data;
    const isDuplicate = data?.error === 'DUPLICATE_ATTENDANCE';
    setFeedback({
      type: isDuplicate ? 'duplicate' : 'error',
      title: isDuplicate ? 'Already Present' : 'Attendance Failed',
      message: data?.message || data?.error || 'Unable to mark attendance.',
      participant: data?.previousAttendance
        ? {
            name: data.previousAttendance.name,
            rollNumber: data.previousAttendance.rollNumber,
            class: '',
            batchType: 'JUNIOR',
            checkInTime: data.previousAttendance.checkInTime,
            message: data.message,
          }
        : undefined,
    });
    vibrate(isDuplicate ? [80, 60, 80] : [120, 80, 120]);
  }, []);

  const markFromQR = useCallback(async () => {
    if (!qrCandidate || qrCandidate.attendanceState === 'loading' || qrCandidate.attendanceState === 'already_marked') return;
    setProcessing(true);
    try {
      const response = await attendanceApi.scan(qrCandidate.raw);
      const attendance = response.data.attendance;
      const participant = response.data.participant;
      setFeedback({
        type: 'success',
        title: 'Attendance Marked',
        message: response.data.message,
        participant: {
          name: participant.name,
          rollNumber: participant.rollNumber,
          class: participant.class,
          batchType: participant.batchType,
          photoUrl: participant.photoUrl,
          checkInTime: attendance.checkInTime,
          message: response.data.message,
        },
      });
      setQrCandidate(null);
      loadRecent();
      vibrate(80);
      window.setTimeout(reset, 3000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setProcessing(false);
    }
  }, [loadRecent, qrCandidate, reset, showApiError]);

  useEffect(() => {
    if (!qrCandidate) return;

    let cancelled = false;
    const checkAttendanceStatus = async () => {
      setQrCandidate(current => {
        if (!current || current.raw !== qrCandidate.raw) return current;
        return { ...current, attendanceState: 'loading', existingAttendance: undefined };
      });

      try {
        const response = await attendanceApi.getList({
          status: 'PRESENT',
          search: qrCandidate.parsed.roll,
          page: 1,
          limit: 50,
        });
        if (cancelled) return;

        const records: RecentAttendance[] = response.data.records || [];
        const participantId = qrCandidate.parsed.id;
        const rollNumber = qrCandidate.parsed.roll.trim().toUpperCase();
        const exactMatch = records.find(record => (
          (participantId && record.participantId === participantId) ||
          record.rollNumber.trim().toUpperCase() === rollNumber
        ));

        setQrCandidate(current => {
          if (!current || current.raw !== qrCandidate.raw) return current;
          if (!exactMatch) {
            return { ...current, attendanceState: 'eligible', existingAttendance: undefined };
          }
          return {
            ...current,
            attendanceState: 'already_marked',
            existingAttendance: {
              checkInTime: exactMatch.checkInTime,
            },
          };
        });
      } catch {
        if (cancelled) return;
        setQrCandidate(current => {
          if (!current || current.raw !== qrCandidate.raw) return current;
          return { ...current, attendanceState: 'error', existingAttendance: undefined };
        });
      }
    };

    checkAttendanceStatus();
    return () => {
      cancelled = true;
    };
  }, [qrCandidate?.raw]);

  const markManual = async (event: React.FormEvent) => {
    event.preventDefault();
    const roll = manualRoll.trim().toUpperCase();
    if (!roll) {
      setFeedback({ type: 'error', title: 'Roll Number Required', message: 'Enter a roll number to mark attendance.' });
      return;
    }
    setProcessing(true);
    try {
      const response = await attendanceApi.manual(roll);
      const attendance = response.data.attendance;
      const participant = response.data.participant;
      setFeedback({
        type: 'success',
        title: 'Manual Attendance Marked',
        message: response.data.message,
        participant: {
          name: participant.name,
          rollNumber: participant.rollNumber,
          class: participant.class,
          batchType: participant.batchType,
          photoUrl: participant.photoUrl,
          checkInTime: attendance.checkInTime,
          message: response.data.message,
        },
      });
      setManualRoll('');
      loadRecent();
      vibrate(80);
      window.setTimeout(reset, 3000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (mode !== 'scan') {
      stopCamera();
      return;
    }

    let cancelled = false;
    async function startCamera() {
      setCameraError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not available in this browser. Use manual entry.');
        return;
      }
      if (!window.BarcodeDetector) {
        setCameraError('QR scanning is not supported in this browser. Use manual entry.');
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('Camera permission was denied or no camera was found. Use manual entry.');
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode, stopCamera]);

  useEffect(() => {
    if (mode !== 'scan' || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const timer = window.setInterval(async () => {
      if (processing || qrCandidate || feedback || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const codes = await detector.detect(canvas);
        const raw = codes[0]?.rawValue;
        if (!raw || raw === lastScanRef.current) return;
        lastScanRef.current = raw;
        const parsed = parseQR(raw);
        if (!parsed) {
          setFeedback({
            type: 'error',
            title: 'Invalid QR Code',
            message: "This QR code is not a Quiz Champ admit card.",
          });
          vibrate([120, 80, 120]);
          return;
        }
        setQrCandidate({ raw, parsed, attendanceState: 'loading' });
        vibrate(50);
      } catch {
        setCameraError('Unable to read QR codes from the camera stream. Use manual entry.');
      }
    }, 700);
    return () => window.clearInterval(timer);
  }, [feedback, mode, processing, qrCandidate]);

  const activeFeedbackVariant = feedback?.type === 'success' ? 'default' : 'destructive';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ScanLine className="size-5 text-primary" />
            Attendance Scanner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Scan admit cards or enter roll numbers at the gate.</p>
        </div>
        <Tabs value={mode} onValueChange={value => { reset(); setMode(value as Mode); }}>
          <TabsList>
            <TabsTrigger value="scan">
              <Camera data-icon="inline-start" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard data-icon="inline-start" />
              Manual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle>Camera</CardTitle>
            <CardDescription>Rear camera is requested automatically on mobile devices.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted sm:aspect-video">
              <video ref={videoRef} className="size-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-primary/70" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {cameraError && (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Scanner unavailable</AlertTitle>
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {mode === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>Use this when the admit card QR cannot be scanned.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={markManual}>
              <Input
                value={manualRoll}
                onChange={event => setManualRoll(event.target.value.toUpperCase())}
                placeholder="Roll number"
                autoCapitalize="characters"
              />
              <Button type="submit" disabled={processing}>
                {processing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <CheckCircle2 data-icon="inline-start" />}
                Mark Present
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!qrCandidate} onOpenChange={open => { if (!open && !processing) setQrCandidate(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Attendance</DialogTitle>
            <DialogDescription>
              {qrCandidate?.attendanceState === 'already_marked'
                ? 'Attendance is already marked for this participant today.'
                : 'Verify the admit-card details before marking this participant present.'}
            </DialogDescription>
          </DialogHeader>
          {qrCandidate && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <Avatar size="lg">
                  <AvatarFallback>{getInitials(qrCandidate.parsed.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{qrCandidate.parsed.name || 'Participant'}</p>
                  <p className="text-sm text-muted-foreground">{qrCandidate.parsed.roll}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">{qrCandidate.parsed.batch}</Badge>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">{qrCandidate.parsed.class || '-'}</p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="font-medium">{qrCandidate.parsed.mobile || '-'}</p>
                </div>
              </div>
              {qrCandidate.attendanceState === 'loading' && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Checking today&apos;s attendance status...
                </div>
              )}
              {qrCandidate.attendanceState === 'already_marked' && (
                <Alert>
                  <Clock />
                  <AlertTitle>Already Marked</AlertTitle>
                  <AlertDescription>
                    Attendance was already marked
                    {qrCandidate.existingAttendance?.checkInTime ? ` at ${formatTime(qrCandidate.existingAttendance.checkInTime)}` : ''}.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={reset} disabled={processing}>
              <XCircle data-icon="inline-start" />
              Cancel
            </Button>
            {qrCandidate?.attendanceState === 'already_marked' ? (
              <Button disabled>
                <CheckCircle2 data-icon="inline-start" />
                Already Marked
              </Button>
            ) : (
              <Button onClick={markFromQR} disabled={processing || qrCandidate?.attendanceState === 'loading'}>
                {(processing || qrCandidate?.attendanceState === 'loading')
                  ? <Loader2 data-icon="inline-start" className="animate-spin" />
                  : <CheckCircle2 data-icon="inline-start" />}
                {qrCandidate?.attendanceState === 'loading' ? 'Checking...' : 'Mark Present'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock data-icon="inline-start" />
            Recent Check-ins
          </CardTitle>
          <CardDescription>Latest 10 participants marked present today.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" />
              Loading recent attendance
            </div>
          )}
          {!recentLoading && recent.length === 0 && (
            <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No attendance marked yet.
            </div>
          )}
          {!recentLoading && recent.map(record => (
            <div key={record.attendanceId || record.participantId} className="flex items-center gap-3 rounded-lg border px-3 py-2">
              <Avatar>
                <AvatarImage src={record.photoUrl} />
                <AvatarFallback>{getInitials(record.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{record.name}</p>
                <p className="text-xs text-muted-foreground">
                  {record.rollNumber} · Class {record.class} · {formatTime(record.checkInTime)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{record.batchType}</Badge>
                <Badge variant="outline">{record.scanMethod}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {feedback && (
        <Alert variant={activeFeedbackVariant}>
          {feedback.type === 'success' ? <CheckCircle2 /> : <ShieldAlert />}
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{feedback.message}</span>
            {feedback.participant && (
              <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3 text-foreground">
                <Avatar>
                  <AvatarImage src={feedback.participant.photoUrl} />
                  <AvatarFallback>{getInitials(feedback.participant.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{feedback.participant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {feedback.participant.rollNumber}{feedback.participant.checkInTime ? ` · ${formatTime(feedback.participant.checkInTime)}` : ''}
                  </p>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="w-fit" onClick={reset}>
              <RotateCcw data-icon="inline-start" />
              Scan Again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
