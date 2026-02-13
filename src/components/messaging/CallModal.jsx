import { useEffect, useRef, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff,
  Volume2, VolumeX, Minimize2,
} from 'lucide-react';
import { useMessaging } from '../../context/MessagingContext.jsx';
import AurbanLogo       from '../AurbanLogo.jsx';

export default function CallModal() {
  const { callState, acceptCall, endCall } = useMessaging();
  const [muted,       setMuted]      = useState(false);
  const [speakerOff,  setSpeakerOff] = useState(false);
  const [duration,    setDuration]   = useState(0);
  const [minimised,   setMinimised]  = useState(false);
  const timerRef = useRef(null);

  // Start call timer once active
  useEffect(() => {
    if (callState?.type === 'active') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState?.type]);

  if (!callState) return null;

  const { type, peerName } = callState;

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Minimised pill (active call) ──────────────────────────
  if (minimised && type === 'active') {
    return (
      <div className="fixed top-20 right-4 z-[100] flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-2xl shadow-xl cursor-pointer"
        onClick={() => setMinimised(false)} aria-label="Open call">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold">{peerName} · {formatDuration(duration)}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); endCall(); }}
          className="flex items-center justify-center w-6 h-6 transition-colors rounded-full bg-white/20 hover:bg-white/40">
          <PhoneOff size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog" aria-modal="true" aria-label={`${type === 'incoming' ? 'Incoming' : 'Outgoing'} call`}>
      <div className="w-full max-w-sm overflow-hidden bg-white shadow-2xl dark:bg-brand-charcoal-dark rounded-3xl">

        {/* Header bar */}
        <div className={`px-5 py-3 flex items-center justify-between ${type === 'active' ? 'bg-emerald-600' : 'bg-brand-charcoal-dark'}`}>
          <AurbanLogo size="xs" variant="white" showName />
          {type === 'active' && (
            <button type="button" onClick={() => setMinimised(true)}
              className="transition-colors text-white/70 hover:text-white" aria-label="Minimise">
              <Minimize2 size={16} />
            </button>
          )}
        </div>

        {/* Avatar + name */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-5 rounded-3xl bg-brand-gold/20">
            <span className="text-4xl font-extrabold font-display text-brand-gold-dark">
              {peerName?.charAt(0)?.toUpperCase()}
            </span>
          </div>

          <h2 className="mb-1 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            {peerName}
          </h2>

          {/* Status */}
          <p className="text-sm text-gray-400 dark:text-white/50">
            {type === 'incoming' ? '📞 Incoming Aurban call…'
            : type === 'outgoing' ? 'Calling…'
            : `🟢 Connected · ${formatDuration(duration)}`}
          </p>

          {/* Animated rings for incoming/outgoing */}
          {type !== 'active' && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-brand-gold animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Active call controls */}
        {type === 'active' && (
          <div className="flex items-center justify-center gap-5 pb-6">
            {/* Mute */}
            <button type="button" onClick={() => setMuted(v => !v)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              aria-pressed={muted}
              className={`flex flex-col items-center gap-1.5 group`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${muted ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white group-hover:bg-brand-gray-soft'}`}>
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </div>
              <span className="text-[10px] font-semibold text-gray-400">{muted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* End */}
            <button type="button" onClick={endCall} aria-label="End call">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center w-16 h-16 transition-colors bg-red-500 shadow-lg rounded-3xl hover:bg-red-600 shadow-red-500/30">
                  <PhoneOff size={26} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400">End</span>
              </div>
            </button>

            {/* Speaker */}
            <button type="button" onClick={() => setSpeakerOff(v => !v)}
              aria-label={speakerOff ? 'Enable speaker' : 'Disable speaker'}
              aria-pressed={speakerOff}
              className="flex flex-col items-center gap-1.5 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${speakerOff ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white group-hover:bg-brand-gray-soft'}`}>
                {speakerOff ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </div>
              <span className="text-[10px] font-semibold text-gray-400">Speaker</span>
            </button>
          </div>
        )}

        {/* Incoming call buttons */}
        {type === 'incoming' && (
          <div className="flex items-center justify-center gap-8 pb-8">
            <button type="button" onClick={endCall} aria-label="Decline call">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 transition-colors bg-red-500 shadow-lg rounded-3xl hover:bg-red-600 shadow-red-500/30">
                  <PhoneOff size={26} className="text-white" />
                </div>
                <span className="text-xs font-bold text-red-500">Decline</span>
              </div>
            </button>
            <button type="button" onClick={acceptCall} aria-label="Accept call">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 transition-colors shadow-lg rounded-3xl bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30">
                  <Phone size={26} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600">Accept</span>
              </div>
            </button>
          </div>
        )}

        {/* Outgoing — cancel only */}
        {type === 'outgoing' && (
          <div className="flex flex-col items-center pb-8">
            <button type="button" onClick={endCall} aria-label="Cancel call">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-16 h-16 transition-colors bg-red-500 shadow-lg rounded-3xl hover:bg-red-600 shadow-red-500/30">
                  <PhoneOff size={26} className="text-white" />
                </div>
                <span className="text-xs font-bold text-red-500">Cancel</span>
              </div>
            </button>
          </div>
        )}

        {/* Privacy note */}
        <p className="text-[11px] text-center text-gray-400 dark:text-white/30 px-6 pb-5">
          🔒 This is an Aurban encrypted call — no phone numbers exchanged
        </p>
      </div>
    </div>
  );
}