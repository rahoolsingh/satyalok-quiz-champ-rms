import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationApi } from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  User, Phone, Mail, BookOpen, Briefcase, MapPin, 
  CreditCard, AlertTriangle, CheckCircle, ExternalLink, ArrowLeft 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ParticipantDetails {
  id: string;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  gender?: 'MALE' | 'FEMALE';
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  photoUrl?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export function Checkout() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantDetails | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!token) {
        setError('Token is missing');
        setLoading(false);
        return;
      }

      try {
        const res = await registrationApi.getParticipantByToken(token);
        setParticipant(res.data.participant);
        setAmount(res.data.amount);
      } catch (err: any) {
        console.error('Failed to fetch token payment details:', err);
        setError(err.response?.data?.error || 'Invalid or expired payment link.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [token]);

  const handlePay = async () => {
    if (!token) return;
    setPaying(true);
    try {
      const res = await registrationApi.initiatePaymentByToken(token);
      if (res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error('No redirect URL returned by gateway');
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      alert(err.response?.data?.error || 'Failed to initiate payment. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size={40} color="#3b82f6" />
          <p className="text-sm text-muted-foreground animate-pulse">Fetching registration details...</p>
        </div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Alert variant="destructive" className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-200 font-bold ml-2">Invalid Link</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300 ml-2 mt-1">
              {error || 'This special payment link is invalid, expired, or has already been used.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="size-4" /> Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isCompleted = participant.paymentStatus === 'COMPLETED';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070913] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full"
      >
        <Card className="shadow-2xl border-border/40 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md">
          <CardHeader className="text-center pb-2 border-b border-border/50 dark:border-gray-800/50">
            <div className="mx-auto size-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
              <CreditCard className="size-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
              Secure Checkout
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              Complete your registration payment securely.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Payment Status Notification Banner */}
            {isCompleted ? (
              <Alert className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <AlertTitle className="text-emerald-800 dark:text-emerald-200 font-bold ml-2">Payment Completed</AlertTitle>
                <AlertDescription className="text-emerald-700 dark:text-emerald-300 ml-2 mt-1">
                  Your payment status is already marked as <strong>COMPLETED</strong>. Your admit card and registration details are accessible.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-200 font-bold ml-2">Action Required</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 ml-2 mt-1">
                  Your registration is pending payment. Use this secure portal to complete your registration fee of <strong>INR {amount}</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Detail Layout */}
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-border/40">
              {participant.photoUrl ? (
                <img 
                  src={participant.photoUrl} 
                  alt={participant.name} 
                  className="size-24 rounded-lg object-cover shadow-md border-2 border-primary/20 shrink-0"
                />
              ) : (
                <div className="size-24 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <User className="size-10" />
                </div>
              )}
              
              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-foreground">{participant.name}</h3>
                  <Badge variant={isCompleted ? "default" : "destructive"} className="text-[10px] tracking-wide uppercase px-2 py-0.5">
                    {participant.paymentStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Briefcase className="size-3.5 text-primary/75" />
                    <span>Batch: <strong>{participant.batchType}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <BookOpen className="size-3.5 text-primary/75" />
                    <span>Class: <strong>{participant.class}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Phone className="size-3.5 text-primary/75" />
                    <span>{participant.mobileNumber}</span>
                  </div>
                  {participant.email && (
                    <div className="flex items-center gap-2 justify-center sm:justify-start truncate">
                      <Mail className="size-3.5 text-primary/75" />
                      <span className="truncate">{participant.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-center sm:justify-start sm:col-span-2 text-left">
                    <MapPin className="size-3.5 text-primary/75 shrink-0" />
                    <span className="line-clamp-2">{participant.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee summary block */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Registration Fee</span>
                <span className="font-semibold text-foreground">INR {amount}.00</span>
              </div>
              <div className="border-t border-primary/10 pt-2 flex justify-between items-center text-base font-bold">
                <span className="text-foreground">Total Payable</span>
                <span className="text-primary dark:text-blue-400">INR {amount}.00</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t border-border/50 dark:border-gray-800/50 pt-4">
            <Button variant="outline" size="default" onClick={() => navigate('/')} className="w-full sm:w-auto order-2 sm:order-1">
              Go to Home
            </Button>
            {isCompleted ? (
              <Button 
                onClick={() => navigate(`/payment-status?participantId=${participant.id}`)}
                className="w-full sm:w-auto order-1 sm:order-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                View Admit Card <ExternalLink className="size-4" />
              </Button>
            ) : (
              <Button 
                onClick={handlePay} 
                disabled={paying}
                className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-lg shadow-blue-500/20"
              >
                {paying ? (
                  <>
                    <LoadingSpinner size={16} color="#ffffff" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Securely with PhonePe <ExternalLink className="size-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
