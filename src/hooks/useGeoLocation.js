import { useState, useCallback, useRef } from 'react';
import { GPS_CONFIG } from '../data/proConstants.js';

/**
 * Browser Geolocation wrapper with haversine distance calculation.
 * Used for provider check-in GPS verification.
 */

/** Calculate distance between two lat/lng points in meters (haversine) */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6_371_000; // earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function useGeoLocation() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const retries = useRef(0);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by this browser.';
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setPosition(coords);
          setLoading(false);
          retries.current = 0;
          resolve(coords);
        },
        (err) => {
          if (retries.current < GPS_CONFIG.maxRetries) {
            retries.current += 1;
            getCurrentPosition().then(resolve).catch(reject);
          } else {
            const msg = err.code === 1 ? 'Location permission denied'
              : err.code === 2 ? 'Location unavailable'
              : 'Location request timed out';
            setError(msg);
            setLoading(false);
            retries.current = 0;
            reject(msg);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: GPS_CONFIG.timeoutMs,
          maximumAge: 0,
        },
      );
    });
  }, []);

  /** Check if provider is within radius of target location */
  const isWithinRadius = useCallback((targetLat, targetLng, radiusM = GPS_CONFIG.radiusMeters) => {
    if (!position) return { within: false, distance: null };
    const dist = haversineDistance(position.lat, position.lng, targetLat, targetLng);
    return { within: dist <= radiusM, distance: Math.round(dist) };
  }, [position]);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    isWithinRadius,
  };
}
