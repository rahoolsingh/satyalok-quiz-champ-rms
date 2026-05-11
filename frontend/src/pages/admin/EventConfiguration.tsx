import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/client';

export function EventConfiguration() {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, []);

  const fetchEventDetails = async () => {
    try {
      const response = await adminApi.getEventDetails();
      const data = response.data;
      
      if (data.eventDate) {
        setEventDate(new Date(data.eventDate).toISOString().split('T')[0]);
      }
      setEventTime(data.eventTime || '');
      setVenue(data.venue || '');
      setVenueMapUrl(data.venueMapUrl || '');
    } catch (err: any) {
      console.error('Failed to fetch event details:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await adminApi.updateEventDetails({
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        venue: venue || undefined,
        venueMapUrl: venueMapUrl || undefined,
      });

      setMessage('Event details updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Event Configuration</h2>
        <p className="text-[#86868b] text-sm mb-6">
          Configure event date, time, and venue details for admit cards
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            />
            <p className="text-xs text-[#86868b] mt-1">
              The date when the quiz competition will be held
            </p>
          </div>

          {/* Event Time */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Event Time
            </label>
            <input
              type="text"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              placeholder="e.g., 10:00 AM - 12:00 PM"
              className="w-full px-4 py-3 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            />
            <p className="text-xs text-[#86868b] mt-1">
              Time range for the event (e.g., "10:00 AM - 12:00 PM")
            </p>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Venue
            </label>
            <textarea
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Satyalok Auditorium, Main Campus, City"
              rows={3}
              className="w-full px-4 py-3 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent resize-none"
            />
            <p className="text-xs text-[#86868b] mt-1">
              Full venue address that will appear on admit cards
            </p>
          </div>

          {/* Venue Map URL */}
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Venue Map URL
            </label>
            <input
              type="url"
              value={venueMapUrl}
              onChange={(e) => setVenueMapUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 border border-[#d2d2d7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
            />
            <p className="text-xs text-[#86868b] mt-1">
              Google Maps link - will be shown as QR code and clickable link on admit cards
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-[#0071e3] text-white rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Event Details'}
          </button>
        </form>

        {/* Preview Section */}
        {(eventDate || eventTime || venue || venueMapUrl) && (
          <div className="mt-8 pt-6 border-t border-[#d2d2d7]">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">Preview</h3>
            <div className="bg-[#f5f5f7] rounded-lg p-4 space-y-2">
              {eventDate && (
                <div>
                  <span className="text-xs text-[#86868b]">Date: </span>
                  <span className="text-sm font-medium text-[#1d1d1f]">
                    {new Date(eventDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {eventTime && (
                <div>
                  <span className="text-xs text-[#86868b]">Time: </span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{eventTime}</span>
                </div>
              )}
              {venue && (
                <div>
                  <span className="text-xs text-[#86868b]">Venue: </span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{venue}</span>
                </div>
              )}
              {venueMapUrl && (
                <div>
                  <span className="text-xs text-[#86868b]">Map: </span>
                  <a
                    href={venueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#0066cc] hover:underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
