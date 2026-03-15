/**
 * ExportControls - Download UI for recorded WebM video and MP4 conversion.
 * Shows download buttons only when a recorded blob exists.
 */

import { useCallback, useState } from 'react';
import { useAppState } from '../state/AppContext';
import { convertWebMToMP4, type ConversionProgress } from '../recording/FFmpegConverter';

export function ExportControls() {
  const { state, dispatch } = useAppState();
  const { recordedBlob, recordingState } = state;
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [converting, setConverting] = useState(false);

  const handleDownload = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [recordedBlob]);

  const handleConvertAndDownload = useCallback(async () => {
    if (!recordedBlob || converting) return;

    setConverting(true);
    setConversionProgress({ phase: 'loading', progress: 0, message: 'Initializing...' });

    try {
      const mp4Blob = await convertWebMToMP4(recordedBlob, (progress) => {
        setConversionProgress(progress);
      });

      // Auto-download the MP4
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setConversionProgress({ phase: 'done', progress: 1, message: 'MP4 downloaded!' });
      // Clear progress after a delay
      setTimeout(() => setConversionProgress(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MP4 conversion failed.';
      dispatch({
        type: 'SET_ERROR',
        payload: { type: 'ffmpeg', message },
      });
      setConversionProgress(null);
    } finally {
      setConverting(false);
    }
  }, [recordedBlob, converting, dispatch]);

  const handleDiscard = useCallback(() => {
    dispatch({ type: 'SET_RECORDED_BLOB', payload: null });
    dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
    setConversionProgress(null);
  }, [dispatch]);

  if (!recordedBlob || recordingState !== 'done') {
    return null;
  }

  const sizeMB = (recordedBlob.size / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
            bg-blue-900/40 border border-blue-600/40 text-blue-300
            hover:bg-blue-800/50 hover:border-blue-500/50
            transition-all duration-200
          "
          aria-label="Download recorded video as WebM"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>WebM ({sizeMB} MB)</span>
        </button>

        <button
          type="button"
          onClick={handleConvertAndDownload}
          disabled={converting}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
            transition-all duration-200 border
            ${converting
              ? 'bg-neutral-800/40 border-neutral-700/30 text-neutral-600 cursor-not-allowed'
              : 'bg-green-900/40 border-green-600/40 text-green-300 hover:bg-green-800/50 hover:border-green-500/50 cursor-pointer'
            }
          `}
          aria-label="Convert recording to MP4 format"
        >
          {converting ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"
                aria-hidden="true"
              />
              Converting...
            </span>
          ) : (
            <span>MP4</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleDiscard}
          className="
            px-3 py-2 rounded-lg font-mono text-xs tracking-wider uppercase
            bg-neutral-800/40 border border-neutral-700/30 text-neutral-500
            hover:bg-neutral-700/50 hover:text-neutral-300
            transition-all duration-200
          "
          aria-label="Discard recording"
          title="Discard this recording"
        >
          Discard
        </button>
      </div>

      {conversionProgress && conversionProgress.phase !== 'done' && (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500/70 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(conversionProgress.progress * 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(conversionProgress.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="MP4 conversion progress"
            />
          </div>
          <p className="text-[10px] font-mono text-neutral-500">
            {conversionProgress.message}
          </p>
        </div>
      )}

      {conversionProgress?.phase === 'done' && (
        <p className="text-[10px] font-mono text-green-400/70">
          {conversionProgress.message}
        </p>
      )}
    </div>
  );
}
