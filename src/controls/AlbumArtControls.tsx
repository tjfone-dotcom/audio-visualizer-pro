import { useRef } from 'react';
import { useAppState } from '../state/AppContext';

/**
 * AlbumArtControls - Upload an album art image file.
 * The image URL is stored in state and displayed on the active player.
 */
export function AlbumArtControls() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous URL to prevent memory leaks
    if (state.albumArtUrl) {
      URL.revokeObjectURL(state.albumArtUrl);
    }

    const url = URL.createObjectURL(file);
    dispatch({ type: 'SET_ALBUM_ART', payload: { url, source: 'user' } });
  }

  function handleClear() {
    if (state.albumArtUrl) {
      URL.revokeObjectURL(state.albumArtUrl);
    }
    dispatch({ type: 'SET_ALBUM_ART', payload: { url: null, source: null } });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        className="
          px-3 py-1.5 rounded-md text-xs font-mono tracking-wide
          bg-neutral-800/60 text-neutral-400
          hover:bg-neutral-700/60 hover:text-neutral-300
          transition-all duration-200 cursor-pointer
          border border-neutral-700/40
        "
      >
        {state.albumArtUrl ? 'Change Art' : 'Album Art'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload album art image"
        />
      </label>
      {state.albumArtUrl && (
        <button
          onClick={handleClear}
          className="
            px-2 py-1.5 rounded-md text-xs font-mono
            text-neutral-500 hover:text-neutral-300
            hover:bg-neutral-700/40 transition-all duration-200
            cursor-pointer
          "
          aria-label="Remove album art"
        >
          Clear
        </button>
      )}
    </div>
  );
}
