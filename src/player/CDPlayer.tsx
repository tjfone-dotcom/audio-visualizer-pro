import { useAppState } from '../state/AppContext';
import { CD_PLAYER } from '../animation/PlayerGeometry';
import { TrackInfo } from './TrackInfo';

/**
 * CDPlayer - Realistic CD player with holographic disc, metallic body, and blue mood lighting.
 * Animation sequence: slideUp (0.8s) -> glow on (0.5s) -> spin (5s/rev)
 */
export function CDPlayer() {
  const { state, dispatch } = useAppState();
  const { animationPhase, albumArtUrl } = state;

  const isVisible = animationPhase !== 'closed';
  const isSpinning = animationPhase === 'playing';
  const isOpen = animationPhase === 'open' || animationPhase === 'playing';

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
          // Auto-advance: glow then play
          setTimeout(() => {
            dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'playing' });
          }, 500);
        }
        if (animationPhase === 'closing') {
          dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'closed' });
        }
      }}
    >
      {/* CD Player body */}
      <div
        style={{
          position: 'absolute',
          left: CD_PLAYER.discX - CD_PLAYER.discRadius - 50,
          top: CD_PLAYER.discY - CD_PLAYER.discRadius - 50,
          width: (CD_PLAYER.discRadius + 50) * 2,
          height: (CD_PLAYER.discRadius + 50) * 2,
          borderRadius: 20,
          background:
            'linear-gradient(160deg, #3a3d4a 0%, #2a2d3a 30%, #1e2030 60%, #282b38 100%)',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(100,120,180,0.1)',
        }}
      />

      {/* Blue mood glow */}
      <div
        className="mood-glow"
        style={{
          left: CD_PLAYER.discX - CD_PLAYER.discRadius - 20,
          top: CD_PLAYER.discY - CD_PLAYER.discRadius - 20,
          width: (CD_PLAYER.discRadius + 20) * 2,
          height: (CD_PLAYER.discRadius + 20) * 2,
          opacity: isOpen ? 0.7 : 0,
          boxShadow: isOpen
            ? '0 0 60px 20px rgba(60, 120, 255, 0.3), inset 0 0 40px rgba(60, 120, 255, 0.1)'
            : 'none',
          transition: 'opacity 0.5s ease, box-shadow 0.5s ease',
        }}
      />

      {/* CD disc */}
      <div
        className={isSpinning ? 'disc-spinning' : ''}
        style={{
          position: 'absolute',
          left: CD_PLAYER.discX - CD_PLAYER.discRadius,
          top: CD_PLAYER.discY - CD_PLAYER.discRadius,
          width: CD_PLAYER.discRadius * 2,
          height: CD_PLAYER.discRadius * 2,
          borderRadius: '50%',
          background: albumArtUrl
            ? `url(${albumArtUrl}) center/cover`
            : 'linear-gradient(135deg, #e8e8f0 0%, #d0d0e0 100%)',
          boxShadow:
            '0 0 0 3px rgba(200,200,220,0.3), 0 4px 16px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Holographic rainbow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `
              conic-gradient(
                from 0deg,
                rgba(255,0,0,0.08) 0deg,
                rgba(255,165,0,0.08) 60deg,
                rgba(255,255,0,0.08) 120deg,
                rgba(0,255,0,0.08) 180deg,
                rgba(0,0,255,0.08) 240deg,
                rgba(128,0,255,0.08) 300deg,
                rgba(255,0,0,0.08) 360deg
              )
            `,
            mixBlendMode: 'screen',
          }}
        />

        {/* Concentric track rings */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `
              radial-gradient(circle,
                transparent 0%,
                transparent 12%,
                rgba(255,255,255,0.03) 13%,
                transparent 14%,
                transparent 24%,
                rgba(255,255,255,0.02) 25%,
                transparent 26%,
                transparent 36%,
                rgba(255,255,255,0.03) 37%,
                transparent 38%,
                transparent 48%,
                rgba(255,255,255,0.02) 49%,
                transparent 50%,
                transparent 60%,
                rgba(255,255,255,0.03) 61%,
                transparent 62%,
                transparent 72%,
                rgba(255,255,255,0.02) 73%,
                transparent 74%,
                transparent 84%,
                rgba(255,255,255,0.03) 85%,
                transparent 86%,
                transparent 95%,
                rgba(200,200,220,0.1) 96%,
                rgba(200,200,220,0.15) 100%
              )
            `,
          }}
        />

        {/* Light reflection streak */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* Center hole */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: CD_PLAYER.holeRadius * 2,
            height: CD_PLAYER.holeRadius * 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1e2030 0%, #282b38 100%)',
            border: '2px solid rgba(200,200,220,0.2)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        />

        {/* Inner ring around hole */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: CD_PLAYER.holeRadius * 2 + 16,
            height: CD_PLAYER.holeRadius * 2 + 16,
            borderRadius: '50%',
            border: '1px solid rgba(200,200,220,0.15)',
          }}
        />
      </div>

      {/* Brand label */}
      <div
        style={{
          position: 'absolute',
          left: CD_PLAYER.discX - 30,
          bottom: 120,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10,
          color: '#556',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        DIGITAL
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
          background: isSpinning ? '#4a9eff' : '#333',
          boxShadow: isSpinning ? '0 0 8px #4a9eff' : 'none',
          transition: 'all 0.3s',
        }}
      />

      <TrackInfo />
    </div>
  );
}
