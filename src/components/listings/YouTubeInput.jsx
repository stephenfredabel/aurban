import { useState, useEffect } from 'react';
import { Youtube, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

// Extract YouTube video ID from common URL formats
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeInput({ value = '', onChange, disabled = false }) {
  const [input, setInput] = useState(value || '');
  const [videoId, setVideoId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!input.trim()) {
      setVideoId(null);
      setError('');
      onChange?.('');
      return;
    }

    // Validate URL domain
    if (!input.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i)) {
      setVideoId(null);
      setError('Please paste a valid YouTube link.');
      return;
    }

    const id = extractYouTubeId(input);
    if (id) {
      setVideoId(id);
      setError('');
      onChange?.(input.trim());
    } else {
      setVideoId(null);
      setError('Could not detect a video from this link. Please check and try again.');
    }
  }, [input, onChange]);

  const clear = () => {
    setInput('');
    setVideoId(null);
    setError('');
    onChange?.('');
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-brand-charcoal-dark dark:text-white mb-1.5">
          Video Tour
          <span className="text-gray-400 font-normal ml-1.5">(Optional)</span>
        </label>

        {/* Input */}
        <div className="relative">
          <Youtube
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
            aria-hidden
          />
          <input
            type="url"
            inputMode="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder="https://www.youtube.com/watch?v=..."
            autoComplete="off"
            spellCheck="false"
            className={[
              'w-full pl-10 pr-10 py-3 rounded-xl text-sm font-body transition-all outline-none',
              'bg-brand-gray-soft dark:bg-white/10',
              'text-brand-charcoal-dark dark:text-white placeholder:text-gray-400',
              'border',
              error
                ? 'border-red-400 focus:border-red-400'
                : videoId
                  ? 'border-emerald-400'
                  : 'border-transparent focus:border-brand-gold focus:bg-white dark:focus:bg-white/20',
            ].join(' ')}
          />
          {input && (
            <button
              type="button"
              onClick={clear}
              aria-label="Remove video"
              className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status messages */}
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5" role="alert">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {videoId && !error && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1.5">
            <CheckCircle2 size={12} />
            Video detected — preview below
          </p>
        )}

        {/* Help text */}
        {!videoId && !error && (
          <div className="p-3 mt-2 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <p className="mb-1 text-xs font-bold text-brand-charcoal-dark dark:text-white">
              ?? How to add your video tour:
            </p>
            <ol className="space-y-1 text-xs text-gray-500 list-decimal list-inside dark:text-gray-400">
              <li>Upload your property walkthrough to YouTube (can be Unlisted)</li>
              <li>Copy the video link from YouTube</li>
              <li>Paste the link above</li>
            </ol>
          </div>
        )}
      </div>

      {/* Embedded preview */}
      {videoId && (
        <div className="overflow-hidden bg-black shadow-lg rounded-2xl">
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Property video tour"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 w-full h-full"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900">
            <div className="flex items-center gap-2">
              <Youtube size={14} className="text-red-500" />
              <span className="text-xs text-white/70 font-body">YouTube · Playing on Aurban</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs transition-colors text-white/50 hover:text-white"
              aria-label="Open on YouTube"
            >
              <ExternalLink size={12} />
              YouTube
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
