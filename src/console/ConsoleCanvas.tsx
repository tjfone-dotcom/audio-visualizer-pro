import { useEffect, useRef } from 'react';
import { CONSOLE_AREA_WIDTH, CONSOLE_AREA_HEIGHT } from '../types/visualizer.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { AnimationController } from '../animation/AnimationController.js';
import { useAppState } from '../state/AppContext.js';

export function ConsoleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<AnimationController | null>(null);
  const { state } = useAppState();

  // Initialize animation controller
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const engine = AudioEngine.getInstance();
    const controller = new AnimationController(
      ctx,
      CONSOLE_AREA_WIDTH,
      CONSOLE_AREA_HEIGHT,
      () => engine.getAnalysers(),
    );
    controllerRef.current = controller;

    // Render initial idle frame
    controller.renderIdle();

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Start/stop animation based on playback state
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (state.playbackState === 'playing') {
      controller.start();
    } else {
      controller.stop();
      // Render one more frame so we see the current state
      controller.renderIdle();
    }
  }, [state.playbackState]);

  return (
    <canvas
      ref={canvasRef}
      width={CONSOLE_AREA_WIDTH}
      height={CONSOLE_AREA_HEIGHT}
      style={{
        width: CONSOLE_AREA_WIDTH,
        height: CONSOLE_AREA_HEIGHT,
        background: '#0f0f0f',
        display: 'block',
      }}
      aria-label="Audio mixing console visualizers showing level meter, RTA, spectrogram, and waveform"
      role="img"
    />
  );
}
