import { useAppState } from '../state/AppContext';
import { TURNTABLE, getTonearmAngle } from '../animation/PlayerGeometry';
import { TrackInfo } from './TrackInfo';

/**
 * TurntablePlayer - Realistic turntable with vinyl record, tonearm, and wood-tone base.
 * Animation sequence: slideUp (0.8s) -> tonearm swing (0.6s) -> spin (5s/rev)
 */
export function TurntablePlayer() {
  const { state, dispatch } = useAppState();
  const { animationPhase, albumArtUrl, currentTime, audioDuration } = state;

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
  const tonearmAngle = getTonearmAngle(progress);

  const isVisible =
    animationPhase !== 'closed';
  const isSpinning = animationPhase === 'playing';
  const isOpen = animationPhase === 'open' || animationPhase === 'playing';
  const tonearmOnRecord = isOpen;

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
          // Auto-advance to playing after tonearm settles
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
        className={isSpinning ? 'disc-spinning' : ''}
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

      {/* Speed indicator label */}
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 120,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: '#665544',
          letterSpacing: 1,
        }}
      >
        33 RPM
      </div>

      {/* Power LED */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          bottom: 120,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isSpinning ? '#0f0' : '#333',
          boxShadow: isSpinning ? '0 0 6px #0f0' : 'none',
          transition: 'all 0.3s',
        }}
      />

      <TrackInfo />
    </div>
  );
}
