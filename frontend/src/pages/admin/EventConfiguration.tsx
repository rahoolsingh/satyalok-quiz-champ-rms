import { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function EventConfiguration() {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [reportingTime, setReportingTime] = useState('');
  const [examTime, setExamTime] = useState('');
  const [venue, setVenue] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState('');
  const [prizeDistributionDate, setPrizeDistributionDate] = useState('');
  const [prizeDistributionTime, setPrizeDistributionTime] = useState('');
  const [prizeDistributionVenue, setPrizeDistributionVenue] = useState('');
  const [prizeDistributionMapUrl, setPrizeDistributionMapUrl] = useState('');
  const [whatsappSupportName, setWhatsappSupportName] = useState('');
  const [whatsappSupportNumber, setWhatsappSupportNumber] = useState('');
  const [callContactName, setCallContactName] = useState('');
  const [callContactNumber, setCallContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchEventDetails(); }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await adminApi.getEventDetails();
      const data = response.data;
      if (data.eventDate) {
        const d = new Date(data.eventDate);
        setEventDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
      }
      if (data.prizeDistributionDate) {
        const d = new Date(data.prizeDistributionDate);
        setPrizeDistributionDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
      }
      setPrizeDistributionVenue(data.prizeDistributionVenue || '');
      setPrizeDistributionTime(data.prizeDistributionTime || '');
      setPrizeDistributionMapUrl(data.prizeDistributionMapUrl || '');
      setEventTime(data.eventTime || '');
      setReportingTime(data.reportingTime || '');
      setExamTime(data.examTime || '');
      setVenue(data.venue || '');
      setVenueMapUrl(data.venueMapUrl || '');
      setWhatsappSupportName(data.whatsappSupportName || '');
      setWhatsappSupportNumber(data.whatsappSupportNumber || '');
      setCallContactName(data.callContactName || '');
      setCallContactNumber(data.callContactNumber || '');
    } catch { console.error('Failed to fetch event details'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    try {
      await adminApi.updateEventDetails({
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        reportingTime: reportingTime || undefined,
        examTime: examTime || undefined,
        venue: venue || undefined,
        venueMapUrl: venueMapUrl || undefined,
        prizeDistributionDate: prizeDistributionDate || undefined,
        prizeDistributionTime: prizeDistributionTime || undefined,
        prizeDistributionVenue: prizeDistributionVenue || undefined,
        prizeDistributionMapUrl: prizeDistributionMapUrl || undefined,
        whatsappSupportName: whatsappSupportName || undefined,
        whatsappSupportNumber: whatsappSupportNumber || undefined,
        callContactName: callContactName || undefined,
        callContactNumber: callContactNumber || undefined,
      });
      setMessage('Event details updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event details');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Event Configuration</CardTitle>
          <CardDescription>Configure event date, time, and venue details for admit cards</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-4 p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20">{message}</div>}
          {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Event Date</label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">The date when the quiz competition will be held</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Event Time (IST)</label>
              <Input type="text" value={eventTime} onChange={e => setEventTime(e.target.value)} placeholder="e.g., 10:00 AM - 12:00 PM" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reporting Time (IST)</label>
                <Input type="text" value={reportingTime} onChange={e => setReportingTime(e.target.value)} placeholder="e.g., 3:00 PM" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Exam Time (IST)</label>
                <Input type="text" value={examTime} onChange={e => setExamTime(e.target.value)} placeholder="e.g., 4:00 PM" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Venue</label>
              <Textarea value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g., Satyalok Auditorium, Main Campus, City" rows={3} />
              <p className="text-xs text-muted-foreground">Full venue address that will appear on admit cards</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Venue Map URL</label>
              <Input type="url" value={venueMapUrl} onChange={e => setVenueMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
              <p className="text-xs text-muted-foreground">Google Maps link - will be shown as QR code and clickable link on admit cards</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prize Distribution Date</label>
              <Input type="date" value={prizeDistributionDate} onChange={e => setPrizeDistributionDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prize Distribution Time (IST)</label>
              <Input type="text" value={prizeDistributionTime} onChange={e => setPrizeDistributionTime(e.target.value)} placeholder="e.g., 11:00 AM" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prize Distribution Venue</label>
              <Input type="text" value={prizeDistributionVenue} onChange={e => setPrizeDistributionVenue(e.target.value)} placeholder="e.g., Satyalok Auditorium" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prize Distribution Map URL</label>
              <Input type="url" value={prizeDistributionMapUrl} onChange={e => setPrizeDistributionMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
            </div>

            <Separator />

            <h3 className="text-lg font-bold">Support Contacts</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">WhatsApp Support Name</label>
                <Input type="text" value={whatsappSupportName} onChange={e => setWhatsappSupportName(e.target.value)} placeholder="e.g., Subodh" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">WhatsApp Number</label>
                <Input type="tel" value={whatsappSupportNumber} onChange={e => setWhatsappSupportNumber(e.target.value)} placeholder="e.g., 6207782702" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Call Contact Name</label>
                <Input type="text" value={callContactName} onChange={e => setCallContactName(e.target.value)} placeholder="e.g., Rahul" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Call Number</label>
                <Input type="tel" value={callContactNumber} onChange={e => setCallContactNumber(e.target.value)} placeholder="e.g., 8210228101" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Event Details'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Separator() {
  return <div className="border-t border-border" />;
}
