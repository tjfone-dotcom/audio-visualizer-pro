import { useEffect, useRef, useState, useCallback } from 'react';
import { VISUALIZATION_WIDTH, VISUALIZATION_HEIGHT, MIN_VIEWPORT_WIDTH } from '../types/visualizer';
import { ConsoleCanvas } from '../console/ConsoleCanvas';
import { PlayerArea } from '../player/PlayerArea';
import { useAppState } from '../state/AppContext';
import { AudioEngine } from '../audio/AudioEngine';
import { FullCanvasRenderer } from '../canvas/FullCanvasRenderer';
import { RecordingManager } from '../recording/RecordingManager';
import type { FullCanvasRenderState } from '../canvas/FullCanvasRenderer';

export function VisualizationArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullRendererRef = useRef<FullCanvasRenderer | null>(null);
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const albumArtImageRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);

  const { state, dispatch } = useAppState();
  const { recordingState, albumArtUrl } = state;

  const isRecording = recordingState === 'recording';

  // Keep a ref to the latest state so the render loop always reads fresh values
  const stateRef = useRef(state);
  stateRef.current = state;

  // Scale handling
  useEffect(() => {
    function updateScale() {
      const vw = window.innerWidth;
      if (vw < MIN_VIEWPORT_WIDTH) {
        setScale(MIN_VIEWPORT_WIDTH / VISUALIZATION_WIDTH);
      } else if (vw < VISUALIZATION_WIDTH + 32) {
        setScale((vw - 32) / VISUALIZATION_WIDTH);
      } else {
        setScale(1);
      }
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Load album art as an Image element for canvas rendering
  useEffect(() => {
    if (!albumArtUrl) {
      albumArtImageRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = albumArtUrl;
    img.onload = () => {
      albumArtImageRef.current = img;
    };
    img.onerror = () => {
      albumArtImageRef.current = null;
    };
  }, [albumArtUrl]);

  // Recording animation loop - reads state from ref to avoid stale closures
  const startRenderLoop = useCallback(() => {
    const canvas = recordingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    if (!fullRendererRef.current) {
      fullRendererRef.current = new FullCanvasRenderer();
    }

    const renderer = fullRendererRef.current;
    const engine = AudioEngine.getInstance();

    function tick(timestamp: number) {
      const s = stateRef.current;
      const analysers = engine.getAnalysers();

      const renderState: FullCanvasRenderState = {
        playerStyle: s.playerStyle,
        animationPhase: s.animationPhase,
        albumArtImage: albumArtImageRef.current,
        currentTime: engine.currentTime,
        audioDuration: engine.duration,
        audioFileName: s.audioFile?.name ?? 'No file loaded',
      };

      renderer.render(ctx, renderState, analysers, timestamp);
      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const stopRenderLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (recordingState === 'recording') {
      // Start recording
      const canvas = recordingCanvasRef.current;
      if (!canvas) return;

      const engine = AudioEngine.getInstance();

      // Initialize renderer
      if (!fullRendererRef.current) {
        fullRendererRef.current = new FullCanvasRenderer();
      }
      fullRendererRef.current.resetRotations();

      // Start render loop first so canvas has content
      startRenderLoop();

      // Start recording manager
      try {
        const manager = new RecordingManager(canvas, engine);
        recordingManagerRef.current = manager;
        manager.start();
      } catch (err) {
        console.error('Failed to start recording:', err);
        dispatch({ type: 'SET_ERROR', payload: { type: 'recording', message: 'Failed to start recording' } });
        dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
        stopRenderLoop();
      }
    } else if (recordingState === 'processing') {
      // Stop recording
      const manager = recordingManagerRef.current;
      if (manager && manager.isRecording()) {
        manager
          .stop()
          .then((blob) => {
            dispatch({ type: 'SET_RECORDED_BLOB', payload: blob });
            dispatch({ type: 'SET_RECORDING_STATE', payload: 'done' });
          })
          .catch((err) => {
            console.error('Failed to stop recording:', err);
            dispatch({ type: 'SET_ERROR', payload: { type: 'recording', message: 'Failed to process recording' } });
            dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
          })
          .finally(() => {
            stopRenderLoop();
            recordingManagerRef.current = null;
          });
      } else {
        // No active recording to stop
        dispatch({ type: 'SET_RECORDING_STATE', payload: 'idle' });
        stopRenderLoop();
      }
    } else {
      // idle or done - ensure render loop is stopped
      stopRenderLoop();
    }
  }, [recordingState, dispatch, startRenderLoop, stopRenderLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRenderLoop();
      const manager = recordingManagerRef.current;
      if (manager && manager.isRecording()) {
        manager.stop().catch(() => {});
      }
    };
  }, [stopRenderLoop]);

  return (
    <div
      className="flex justify-center"
      style={{
        height: VISUALIZATION_HEIGHT * scale,
      }}
    >
      <div
        ref={containerRef}
        className="flex border border-neutral-800"
        style={{
          width: VISUALIZATION_WIDTH,
          height: VISUALIZATION_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          position: 'relative',
        }}
      >
        {/* Normal mode: HTML player + ConsoleCanvas */}
        <div style={{ display: isRecording ? 'none' : 'contents' }}>
          <PlayerArea />
          <ConsoleCanvas />
        </div>

        {/* Recording mode: Full 1280x720 canvas */}
        <canvas
          ref={recordingCanvasRef}
          width={VISUALIZATION_WIDTH}
          height={VISUALIZATION_HEIGHT}
          style={{
            width: VISUALIZATION_WIDTH,
            height: VISUALIZATION_HEIGHT,
            background: '#0a0a0a',
            display: isRecording ? 'block' : 'none',
          }}
          aria-label="Recording canvas showing player and mixing console visualizers"
          role="img"
        />

        {/* Recording indicator overlay */}
        {isRecording && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,0,0,0.3)',
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#f00',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#f88',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              REC
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
