/**
 * ErrorBanner - Global error toast/banner that displays errors from app state.
 * Shows error type icon, user-friendly message, and a dismiss button.
 */

import { useAppState } from '../state/AppContext';
import type { ErrorType } from '../types/player';

const ERROR_LABELS: Record<ErrorType, string> = {
  audio: 'Audio Error',
  recording: 'Recording Error',
  ai: 'AI Generation Error',
  ffmpeg: 'Video Conversion Error',
};

const ERROR_COLORS: Record<ErrorType, { bg: string; border: string; text: string; icon: string }> = {
  audio: { bg: 'bg-red-900/40', border: 'border-red-600/40', text: 'text-red-300', icon: 'text-red-400' },
  recording: { bg: 'bg-orange-900/40', border: 'border-orange-600/40', text: 'text-orange-300', icon: 'text-orange-400' },
  ai: { bg: 'bg-purple-900/40', border: 'border-purple-600/40', text: 'text-purple-300', icon: 'text-purple-400' },
  ffmpeg: { bg: 'bg-yellow-900/40', border: 'border-yellow-600/40', text: 'text-yellow-300', icon: 'text-yellow-400' },
};

export function ErrorBanner() {
  const { state, dispatch } = useAppState();

  if (!state.error) return null;

  const { type, message } = state.error;
  const label = ERROR_LABELS[type];
  const colors = ERROR_COLORS[type];

  function handleDismiss() {
    dispatch({ type: 'SET_ERROR', payload: null });
  }

  return (
    <div
      role="alert"
      className={`
        w-full max-w-5xl mx-auto px-4 py-3 rounded-lg
        ${colors.bg} border ${colors.border}
        flex items-start gap-3
        animate-[fadeSlideIn_0.25s_ease-out]
      `}
    >
      {/* Error icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${colors.icon} mt-0.5 shrink-0`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-mono tracking-wider uppercase ${colors.icon} mb-0.5`}>
          {label}
        </p>
        <p className={`text-xs font-mono ${colors.text} leading-relaxed break-words`}>
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className={`
          shrink-0 p-1 rounded-md
          ${colors.text} opacity-60 hover:opacity-100
          hover:bg-white/5 transition-all duration-200
          cursor-pointer
        `}
        aria-label="Dismiss error"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
