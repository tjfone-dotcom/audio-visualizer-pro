import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../state/AppContext';
import { TURNTABLE, getTonearmAngle } from '../animation/PlayerGeometry';
import { TrackInfo } from './TrackInfo';
import { LyricsDisplay } from './LyricsDisplay';
import { AudioEngine } from '../audio/AudioEngine';

/**
 * TurntablePlayer - Realistic turntable with vinyl record, tonearm, and wood-tone base.
 * Animation sequence: slideUp (0.8s) -> tonearm swing (0.6s) -> spin (5s/rev)
 */
export function TurntablePlayer() {
  const { state, dispatch } = useAppState();
  const { animationPhase, playbackState, albumArtUrl, currentTime, audioDuration, mediaSwapTrigger } = state;

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
  const tonearmAngle = getTonearmAngle(progress);

  const isVisible = animationPhase !== 'closed';
  const isSpinning = animationPhase === 'playing';
  const tonearmOnRecord = animationPhase === 'playing';

  // Disc swap animation
  const [showSwap, setShowSwap] = useState(false);
  const prevSwapTrigger = useRef(mediaSwapTrigger);

  useEffect(() => {
    if (mediaSwapTrigger > 0 && mediaSwapTrigger !== prevSwapTrigger.current) {
      setShowSwap(true);
      const timer = setTimeout(() => setShowSwap(false), 1200);
      prevSwapTrigger.current = mediaSwapTrigger;
      return () => clearTimeout(timer);
    }
    prevSwapTrigger.current = mediaSwapTrigger;
  }, [mediaSwapTrigger]);

  // Real-time bass energy level for analog slider (0~1, smoothed)
  // Use ref + throttled setState to avoid excessive re-renders
  const [bassLevel, setBassLevel] = useState(0);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef(0);
  const lastSetRef = useRef(0);

  useEffect(() => {
    if (animationPhase !== 'playing') {
      setBassLevel(0);
      smoothedRef.current = 0;
      lastSetRef.current = 0;
      return;
    }
    const engine = AudioEngine.getInstance();
    const UPDATE_INTERVAL = 50; // ms - update state ~20fps instead of 60fps

    const tick = (now: number) => {
      const analysers = engine.getAnalysers();
      if (analysers) {
        const data = new Uint8Array(analysers.medium.frequencyBinCount);
        analysers.medium.getByteFrequencyData(data);
        // Bass energy (bins 0~15 ≈ 0~330Hz) normalized to 0~1
        let bassSum = 0;
        for (let i = 0; i < 16; i++) bassSum += data[i];
        const normalized = bassSum / 16 / 255;
        // Smooth lerp for gentle movement
        smoothedRef.current = smoothedRef.current * 0.92 + normalized * 0.08;
        // Throttle setState to reduce re-renders
        if (now - lastSetRef.current > UPDATE_INTERVAL) {
          setBassLevel(smoothedRef.current);
          lastSetRef.current = now;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animationPhase]);

  // 3-way disc class: spinning / paused / stopped
  const getDiscClass = () => {
    const classes: string[] = [];
    if (animationPhase === 'playing') classes.push('disc-spinning');
    else if (playbackState === 'paused') classes.push('disc-spinning-paused');
    if (showSwap) classes.push('disc-swap-in');
    return classes.join(' ');
  };

  if (!isVisible) return null;

  const phaseClass =
    animationPhase === 'opening'
      ? 'player-phase-opening'
      : animationPhase === 'closing'
        ? 'player-phase-closing'
        : '';

  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      className={phaseClass}
      onAnimationEnd={() => {
        if (animationPhase === 'opening') {
          dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'open' });
          setTimeout(() => {
            dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'playing' });
          }, 600);
        }
        if (animationPhase === 'closing') {
          dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'closed' });
        }
      }}
    >
      {/* Wood-tone turntable base */}
      <div
        style={{
          position: 'absolute',
          left: TURNTABLE.platterX - TURNTABLE.platterRadius - 40,
          top: TURNTABLE.platterY - TURNTABLE.platterRadius - 40,
          width: (TURNTABLE.platterRadius + 40) * 2,
          height: (TURNTABLE.platterRadius + 40) * 2,
          borderRadius: 16,
          background:
            'linear-gradient(145deg, #5c3a1e 0%, #7a4e2d 30%, #6b3f1f 60%, #4a2a12 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />

      {/* Platter (metal ring) */}
      <div
        style={{
          position: 'absolute',
          left: TURNTABLE.platterX - TURNTABLE.platterRadius,
          top: TURNTABLE.platterY - TURNTABLE.platterRadius,
          width: TURNTABLE.platterRadius * 2,
          height: TURNTABLE.platterRadius * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, #222 0%, #1a1a1a 70%, #333 85%, #222 100%)',
          boxShadow:
            'inset 0 0 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Vinyl record */}
      <div
        className={getDiscClass()}
        style={{
          position: 'absolute',
          left: TURNTABLE.platterX - TURNTABLE.vinylRadius,
          top: TURNTABLE.platterY - TURNTABLE.vinylRadius,
          width: TURNTABLE.vinylRadius * 2,
          height: TURNTABLE.vinylRadius * 2,
          borderRadius: '50%',
          background: `
            radial-gradient(circle,
              transparent 0%,
              transparent ${(TURNTABLE.labelRadius / TURNTABLE.vinylRadius) * 100 - 1}%,
              #111 ${(TURNTABLE.labelRadius / TURNTABLE.vinylRadius) * 100}%,
              #1a1a1a ${(TURNTABLE.labelRadius / TURNTABLE.vinylRadius) * 100 + 2}%,
              #0d0d0d 40%,
              #1a1a1a 42%,
              #0f0f0f 55%,
              #1a1a1a 57%,
              #0d0d0d 70%,
              #1a1a1a 72%,
              #0f0f0f 85%,
              #1a1a1a 87%,
              #111 99%,
              #222 100%
            )
          `,
          boxShadow:
            '0 0 0 2px #333, inset 0 0 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Center label with album art */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: TURNTABLE.labelRadius * 2,
            height: TURNTABLE.labelRadius * 2,
            borderRadius: '50%',
            background: albumArtUrl
              ? `url(${albumArtUrl}) center/cover`
              : 'radial-gradient(circle, #d44 0%, #a22 60%, #811 100%)',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)',
            border: '2px solid #333',
          }}
        >
          {/* Spindle hole */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#333',
              border: '1px solid #555',
            }}
          />
        </div>
      </div>

      {/* Tonearm assembly */}
      <div
        style={{
          position: 'absolute',
          left: TURNTABLE.tonearmPivotX,
          top: TURNTABLE.tonearmPivotY,
          transformOrigin: '0 0',
          transform: `rotate(${tonearmOnRecord ? tonearmAngle : TURNTABLE.tonearmRestAngle}deg)`,
          transition: 'transform 0.6s ease-in-out',
          zIndex: 10,
        }}
      >
        {/* Pivot base */}
        <div
          style={{
            position: 'absolute',
            left: -10,
            top: -10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #888 0%, #555 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            zIndex: 2,
          }}
        />

        {/* Tonearm bar */}
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 0,
            width: 6,
            height: TURNTABLE.tonearmLength,
            background: 'linear-gradient(90deg, #999 0%, #ccc 50%, #999 100%)',
            borderRadius: 3,
            boxShadow: '1px 2px 4px rgba(0,0,0,0.4)',
            transformOrigin: 'top center',
          }}
        />

        {/* Headshell */}
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: TURNTABLE.tonearmLength - 5,
            width: 16,
            height: 24,
            background: 'linear-gradient(180deg, #aaa 0%, #777 100%)',
            borderRadius: '2px 2px 4px 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />

        {/* Cartridge/stylus */}
        <div
          style={{
            position: 'absolute',
            left: -2,
            top: TURNTABLE.tonearmLength + 17,
            width: 4,
            height: 8,
            background: '#555',
            borderRadius: '0 0 2px 2px',
          }}
        />
      </div>

      {/* Analog bass slider + STEREO label */}
      <div
        style={{
          position: 'absolute',
          right: 55,
          bottom: 120,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Slider */}
        <div
          style={{
            position: 'relative',
            width: 48,
            height: 4,
            borderRadius: 2,
            background: '#332b20',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          {/* Knob */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${(isSpinning ? bassLevel : 0.5) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #bba880 0%, #998866 100%)',
              boxShadow: '0 0 4px rgba(153,136,102,0.3), 0 1px 2px rgba(0,0,0,0.3)',
              transition: 'left 0.15s ease-out',
            }}
          />
        </div>
        {/* STEREO label */}
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            color: '#665544',
            letterSpacing: 1,
          }}
        >
          STEREO
        </span>
      </div>

      {/* Power LED */}
      <div
        className={!isSpinning && isVisible ? 'led-idle' : ''}
        style={{
          position: 'absolute',
          left: 60,
          bottom: 120,
          width: 6,
          height: 6,
          borderRadius: '50%',
          color: '#0f0',
          background: isSpinning ? '#0f0' : '#0a4a0a',
          boxShadow: isSpinning ? '0 0 6px #0f0' : 'none',
          transition: isSpinning ? 'all 0.3s' : 'none',
        }}
      />

      <LyricsDisplay />
      <TrackInfo />
    </div>
  );
}
