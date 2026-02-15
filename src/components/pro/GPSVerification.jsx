import { useState } from 'react';
import { MapPin, Loader2, CheckCircle2, XCircle, Navigation } from 'lucide-react';
import useGeoLocation, { haversineDistance } from '../../hooks/useGeoLocation.js';
import { GPS_CONFIG } from '../../data/proConstants.js';

/**
 * GPS verification component — checks if the provider is within
 * the allowed radius (200m) of the booking location.
 * Displays real-time distance and pass/fail status.
 */
export default function GPSVerification({ targetLat, targetLng, onVerified }) {
  const geo = useGeoLocation();
  const [status, setStatus] = useState('idle'); // idle | checking | pass | fail
  const [distance, setDistance] = useState(null);

  async function handleCheck() {
    setStatus('checking');
    try {
      const coords = await geo.getCurrentPosition();
      const dist = haversineDistance(coords.lat, coords.lng, targetLat, targetLng);
      const rounded = Math.round(dist);
      setDistance(rounded);

      if (rounded <= GPS_CONFIG.radiusMeters) {
        setStatus('pass');
        onVerified?.({ ...coords, distance: rounded, verified: true });
      } else {
        setStatus('fail');
      }
    } catch {
      setStatus('fail');
    }
  }

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          status === 'pass' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
          status === 'fail' ? 'bg-red-100 dark:bg-red-500/20' :
          'bg-gray-100 dark:bg-white/5'
        }`}>
          {status === 'checking' && <Loader2 size={18} className="text-blue-500 animate-spin" />}
          {status === 'pass' && <CheckCircle2 size={18} className="text-emerald-600" />}
          {status === 'fail' && <XCircle size={18} className="text-red-500" />}
          {status === 'idle' && <Navigation size={18} className="text-gray-400" />}
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Location Verification</p>
          <p className="text-xs text-gray-400">
            {status === 'idle' && 'Tap to verify your location'}
            {status === 'checking' && 'Getting your location...'}
            {status === 'pass' && `Verified — ${distance}m from target`}
            {status === 'fail' && (distance ? `Too far — ${distance}m (max ${GPS_CONFIG.radiusMeters}m)` : geo.error || 'Verification failed')}
          </p>
        </div>
      </div>

      {/* Distance indicator */}
      {distance !== null && (
        <div className="mb-3">
          <div className="flex justify-between mb-1 text-[10px] text-gray-400">
            <span>0m</span>
            <span>{GPS_CONFIG.radiusMeters}m</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${status === 'pass' ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (distance / GPS_CONFIG.radiusMeters) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] font-bold text-gray-500">
            {distance}m / {GPS_CONFIG.radiusMeters}m
          </p>
        </div>
      )}

      {(status === 'idle' || status === 'fail') && (
        <button
          onClick={handleCheck}
          disabled={geo.loading}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark transition-colors disabled:opacity-50"
        >
          <MapPin size={14} />
          {status === 'fail' ? 'Retry Verification' : 'Verify My Location'}
        </button>
      )}

      {status === 'pass' && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-600">
          <CheckCircle2 size={14} />
          Location verified successfully
        </div>
      )}
    </div>
  );
}
