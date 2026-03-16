import { useRef, useState, useCallback } from 'react';
import { useAppState } from '../state/AppContext';
import { AudioEngine } from '../audio/AudioEngine';
import { analyzeMusicCharacteristics, generatePromptFromCharacteristics } from '../ai/musicAnalyzer';
import { generateAlbumArt } from '../ai/albumArtGenerator';

/**
 * AlbumArtControls - Upload album art or generate it with AI.
 * Includes API key input, user hint, music analysis, and Imagen API integration.
 */
export function AlbumArtControls() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [userHint, setUserHint] = useState('');
  const [showAI, setShowAI] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (state.albumArtUrl && state.albumArtSource === 'user') {
      URL.revokeObjectURL(state.albumArtUrl);
    }

    const url = URL.createObjectURL(file);
    dispatch({ type: 'SET_ALBUM_ART', payload: { url, source: 'user' } });
  }

  function handleClear() {
    if (state.albumArtUrl && state.albumArtSource === 'user') {
      URL.revokeObjectURL(state.albumArtUrl);
    }
    dispatch({ type: 'SET_ALBUM_ART', payload: { url: null, source: null } });
    dispatch({ type: 'SET_AI_PROMPT', payload: '' });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  const handleAnalyzeAndGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      dispatch({
        type: 'SET_ERROR',
        payload: { type: 'ai', message: 'Please enter your Google AI Studio API key.' },
      });
      return;
    }

    const engine = AudioEngine.getInstance();
    const analysers = engine.getAnalysers();

    if (!analysers) {
      dispatch({
        type: 'SET_ERROR',
        payload: { type: 'ai', message: 'Please load and play an audio file first so the music can be analyzed.' },
      });
      return;
    }

    dispatch({ type: 'SET_AI_GENERATING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Analyze music using the medium analyser (balanced smoothing)
      const characteristics = await analyzeMusicCharacteristics(analysers.medium, 3000);
      const prompt = generatePromptFromCharacteristics(characteristics, userHint);

      dispatch({ type: 'SET_AI_PROMPT', payload: prompt });

      // Generate album art
      const dataUrl = await generateAlbumArt(prompt, apiKey);

      dispatch({ type: 'SET_ALBUM_ART', payload: { url: dataUrl, source: 'ai' } });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'ai',
          message: err instanceof Error ? err.message : 'Failed to generate album art.',
        },
      });
    } finally {
      dispatch({ type: 'SET_AI_GENERATING', payload: false });
    }
  }, [apiKey, userHint, dispatch]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label
          className="
            py-1.5 rounded-md text-xs font-mono tracking-wide text-center
            bg-neutral-800/60 text-neutral-400
            hover:bg-neutral-700/60 hover:text-neutral-300
            transition-all duration-200 cursor-pointer
            border border-neutral-700/40
          "
          style={{ width: 80, display: 'inline-block' }}
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

        <button
          type="button"
          onClick={() => setShowAI(!showAI)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-mono tracking-wide
            transition-all duration-200 cursor-pointer
            border
            ${showAI
              ? 'bg-purple-900/40 border-purple-600/40 text-purple-300'
              : 'bg-neutral-800/60 border-neutral-700/40 text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-300'
            }
          `}
          aria-label="Toggle AI album art generation"
          aria-expanded={showAI}
        >
          AI Gen
        </button>

        {state.albumArtSource === 'ai' && state.albumArtUrl && (
          <button
            type="button"
            onClick={() => {
              const link = document.createElement('a');
              link.href = state.albumArtUrl!;
              link.download = `album-art-${Date.now()}.png`;
              link.click();
            }}
            className="
              p-1.5 rounded-md text-xs
              transition-all duration-200 cursor-pointer
              bg-neutral-800/60 border border-neutral-700/40
              text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-300
            "
            aria-label="Download AI generated album art"
            title="Download AI album art"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        <button
          onClick={handleClear}
          disabled={!state.albumArtUrl}
          className="
            px-2 py-1.5 rounded-md text-xs font-mono
            transition-all duration-200
          "
          style={{
            opacity: state.albumArtUrl ? 1 : 0,
            pointerEvents: state.albumArtUrl ? 'auto' : 'none',
            color: '#737373',
            cursor: state.albumArtUrl ? 'pointer' : 'default',
          }}
          aria-label="Remove album art"
        >
          Clear
        </button>
      </div>

      {showAI && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-neutral-800/40 border border-neutral-700/30">
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Google AI Studio API Key"
              className="
                flex-1 px-3 py-1.5 rounded-md text-xs font-mono
                bg-neutral-900/60 border border-neutral-700/40
                text-neutral-300 placeholder-neutral-600
                focus:outline-none focus:border-purple-600/50
                transition-colors duration-200
              "
              aria-label="Google AI Studio API key"
              autoComplete="off"
            />
          </div>

          <input
            type="text"
            value={userHint}
            onChange={(e) => setUserHint(e.target.value)}
            placeholder="Style hint (optional): e.g. cyberpunk, watercolor, minimalist"
            className="
              px-3 py-1.5 rounded-md text-xs font-mono
              bg-neutral-900/60 border border-neutral-700/40
              text-neutral-300 placeholder-neutral-600
              focus:outline-none focus:border-purple-600/50
              transition-colors duration-200
            "
            aria-label="Optional style hint for AI generation"
          />

          <button
            type="button"
            onClick={handleAnalyzeAndGenerate}
            disabled={state.aiGenerating || !apiKey.trim()}
            className={`
              px-4 py-2 rounded-md text-xs font-mono tracking-wider uppercase
              transition-all duration-200
              border
              ${state.aiGenerating || !apiKey.trim()
                ? 'bg-neutral-800/40 border-neutral-700/30 text-neutral-600 cursor-not-allowed'
                : 'bg-purple-900/40 border-purple-600/40 text-purple-300 hover:bg-purple-800/50 hover:border-purple-500/50 cursor-pointer'
              }
            `}
            aria-label="Analyze music and generate album art"
          >
            {state.aiGenerating ? (
              <span className="flex items-center gap-2 justify-center">
                <span
                  className="inline-block w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"
                  aria-hidden="true"
                />
                Analyzing & Generating...
              </span>
            ) : (
              'Analyze Music & Generate Art'
            )}
          </button>

          {state.aiPrompt && (
            <div className="mt-1">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                Generated Prompt:
              </p>
              <p className="text-[11px] font-mono text-neutral-400 leading-relaxed bg-neutral-900/40 rounded p-2 break-words">
                {state.aiPrompt}
              </p>
            </div>
          )}

          <p className="text-[10px] font-mono text-neutral-600 leading-relaxed">
            API key is used only in your browser and is never stored or sent to any server other than Google AI.
          </p>
        </div>
      )}
    </div>
  );
}
