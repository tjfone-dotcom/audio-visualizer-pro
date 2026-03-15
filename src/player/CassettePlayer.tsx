import { useMemo } from 'react';
import { useAppState } from '../state/AppContext';
import { CASSETTE, getCassetteReelSpeeds } from '../animation/PlayerGeometry';
import { TrackInfo } from './TrackInfo';

/**
 * CassettePlayer - Realistic cassette player with visible tape reels, chrome accents,
 * and warm amber mood lighting.
 * Animation sequence: slideUp (0.8s) -> glow on (0.5s) -> reel spin (variable speed)
 */
export function CassettePlayer() {
  const { state, dispatch } = useAppState();
  const { animationPhase, albumArtUrl, currentTime, audioDuration } = state;

  const isVisible = animationPhase !== 'closed';
  const isSpinning = animationPhase === 'playing';
  const isOpen = animationPhase === 'open' || animationPhase === 'playing';

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
  const reelSpeeds = useMemo(() => getCassetteReelSpeeds(progress), [progress]);

  if (!isVisible) return null;

  const phaseClass =
    animationPhase === 'opening'
      ? 'player-phase-opening'
      : animationPhase === 'closing'
        ? 'player-phase-closing'
        : '';

  const bodyLeft = CASSETTE.bodyX - CASSETTE.bodyWidth / 2;
  const bodyTop = CASSETTE.bodyY - CASSETTE.bodyHeight / 2;

  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      className={phaseClass}
      onAnimationEnd={() => {
        if (animationPhase === 'opening') {
          dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'open' });
          setTimeout(() => {
            dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'playing' });
          }, 500);
        }
        if (animationPhase === 'closing') {
          dispatch({ type: 'SET_ANIMATION_PHASE', payload: 'closed' });
        }
      }}
    >
      {/* Cassette player body (deck) */}
      <div
        style={{
          position: 'absolute',
          left: bodyLeft - 60,
          top: bodyTop - 80,
          width: CASSETTE.bodyWidth + 120,
          height: CASSETTE.bodyHeight + 160,
          borderRadius: 16,
          background:
            'linear-gradient(180deg, #2a2a2e 0%, #1e1e22 40%, #222226 100%)',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      />

      {/* Amber mood glow around reels */}
      <div
        className="mood-glow"
        style={{
          left: CASSETTE.bodyX - CASSETTE.windowWidth / 2 - 20,
          top: CASSETTE.reelY - CASSETTE.reelRadius - 30,
          width: CASSETTE.windowWidth + 40,
          height: CASSETTE.reelRadius * 2 + 60,
          borderRadius: 20,
          opacity: isOpen ? 0.6 : 0,
          boxShadow: isOpen
            ? '0 0 40px 10px rgba(255, 170, 50, 0.2), inset 0 0 20px rgba(255, 170, 50, 0.05)'
            : 'none',
        }}
      />

      {/* Cassette shell */}
      <div
        style={{
          position: 'absolute',
          left: bodyLeft,
          top: bodyTop,
          width: CASSETTE.bodyWidth,
          height: CASSETTE.bodyHeight,
          borderRadius: 12,
          background:
            'linear-gradient(180deg, #3a3a40 0%, #2d2d33 50%, #252529 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Album art label strip at top */}
        <div
          style={{
            position: 'absolute',
            left: (CASSETTE.bodyWidth - CASSETTE.labelWidth) / 2,
            top: 14,
            width: CASSETTE.labelWidth,
            height: CASSETTE.labelHeight,
            borderRadius: 4,
            background: albumArtUrl
              ? `url(${albumArtUrl}) center/cover`
              : 'linear-gradient(90deg, #c4a265 0%, #d4b275 50%, #c4a265 100%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
            border: '1px solid rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!albumArtUrl && (
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 9,
                color: '#555',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              AUDIO CASSETTE
            </span>
          )}
        </div>

        {/* Tape window (transparent area showing reels) */}
        <div
          style={{
            position: 'absolute',
            left: (CASSETTE.bodyWidth - CASSETTE.windowWidth) / 2,
            top: CASSETTE.labelHeight + 30,
            width: CASSETTE.windowWidth,
            height: CASSETTE.windowHeight,
            borderRadius: 8,
            background:
              'linear-gradient(180deg, rgba(40,35,30,0.95) 0%, rgba(30,25,20,0.95) 100%)',
            boxShadow:
              'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Tape between reels */}
          <div
            style={{
              position: 'absolute',
              left: CASSETTE.windowWidth / 2 - 85 - CASSETTE.reelRadius,
              top: CASSETTE.windowHeight / 2 - 2,
              width: (85 + CASSETTE.reelRadius) * 2,
              height: 4,
              background: 'rgba(60, 40, 20, 0.6)',
            }}
          />
          {/* Tape path - top */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: CASSETTE.windowHeight / 2 - CASSETTE.reelRadius - 8,
              width: CASSETTE.windowWidth - 40,
              height: 2,
              background: 'rgba(80, 50, 25, 0.4)',
              borderRadius: 1,
            }}
          />
          {/* Tape path - bottom */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: CASSETTE.windowHeight / 2 - CASSETTE.reelRadius - 8,
              width: CASSETTE.windowWidth - 40,
              height: 2,
              background: 'rgba(80, 50, 25, 0.4)',
              borderRadius: 1,
            }}
          />

          {/* Left reel (supply) */}
          <Reel
            cx={CASSETTE.windowWidth / 2 - 85}
            cy={CASSETTE.windowHeight / 2}
            radius={CASSETTE.reelRadius}
            hubRadius={CASSETTE.reelHubRadius}
            spinning={isSpinning}
            duration={reelSpeeds.leftDuration}
            tapeRadius={CASSETTE.reelRadius * (1 - progress * 0.6)}
          />

          {/* Right reel (take-up) */}
          <Reel
            cx={CASSETTE.windowWidth / 2 + 85}
            cy={CASSETTE.windowHeight / 2}
            radius={CASSETTE.reelRadius}
            hubRadius={CASSETTE.reelHubRadius}
            spinning={isSpinning}
            duration={reelSpeeds.rightDuration}
            tapeRadius={CASSETTE.reelHubRadius + (CASSETTE.reelRadius - CASSETTE.reelHubRadius) * progress * 0.6 + CASSETTE.reelHubRadius}
          />
        </div>

        {/* Screw holes */}
        {[
          [20, 20],
          [CASSETTE.bodyWidth - 20, 20],
          [20, CASSETTE.bodyHeight - 20],
          [CASSETTE.bodyWidth - 20, CASSETTE.bodyHeight - 20],
          [CASSETTE.bodyWidth / 2, CASSETTE.bodyHeight - 16],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 4,
              top: y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #444 0%, #333 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }}
          />
        ))}

        {/* Head guide slots at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: CASSETTE.bodyWidth / 2 - 80,
            width: 160,
            height: 16,
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          {[28, 20, 40, 20, 28].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 14,
                borderRadius: 2,
                background: '#1a1a1e',
                border: '1px solid rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Chrome trim line */}
      <div
        style={{
          position: 'absolute',
          left: bodyLeft - 40,
          top: bodyTop + CASSETTE.bodyHeight + 40,
          width: CASSETTE.bodyWidth + 80,
          height: 2,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(200,200,210,0.2) 20%, rgba(200,200,210,0.4) 50%, rgba(200,200,210,0.2) 80%, transparent 100%)',
        }}
      />

      {/* VU meter indicators */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          bottom: 125,
          display: 'flex',
          gap: 3,
        }}
      >
        {[0.3, 0.5, 0.7, 0.9, 1.0].map((threshold, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 12,
              borderRadius: 1,
              background:
                isSpinning && Math.random() > threshold
                  ? i >= 4
                    ? '#f44'
                    : i >= 3
                      ? '#fa0'
                      : '#4a4'
                  : '#333',
              transition: 'background 0.1s',
            }}
          />
        ))}
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
          background: isSpinning ? '#ffaa32' : '#333',
          boxShadow: isSpinning ? '0 0 8px #ffaa32' : 'none',
          transition: 'all 0.3s',
        }}
      />

      <TrackInfo />
    </div>
  );
}

/** Individual reel component */
function Reel({
  cx,
  cy,
  radius,
  hubRadius,
  spinning,
  duration,
  tapeRadius,
}: {
  cx: number;
  cy: number;
  radius: number;
  hubRadius: number;
  spinning: boolean;
  duration: number;
  tapeRadius: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - radius,
        top: cy - radius,
        width: radius * 2,
        height: radius * 2,
      }}
    >
      {/* Tape spool (visible tape amount) */}
      <div
        style={{
          position: 'absolute',
          left: radius - tapeRadius,
          top: radius - tapeRadius,
          width: tapeRadius * 2,
          height: tapeRadius * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, transparent 30%, rgba(50, 30, 15, 0.6) 40%, rgba(60, 35, 18, 0.8) 100%)',
          transition: 'all 0.5s ease',
        }}
      />

      {/* Reel hub (spinning part) */}
      <div
        className={spinning ? 'reel-spinning' : ''}
        style={{
          position: 'absolute',
          left: radius - hubRadius,
          top: radius - hubRadius,
          width: hubRadius * 2,
          height: hubRadius * 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, #666 0%, #555 40%, #444 100%)',
          border: '2px solid #777',
          boxShadow:
            'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.4)',
          animationDuration: spinning ? `${duration}s` : undefined,
        }}
      >
        {/* Reel spokes */}
        {[0, 120, 240].map((angle) => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              left: hubRadius - 2,
              top: 2,
              width: 4,
              height: hubRadius - 2,
              background: '#555',
              transformOrigin: `2px ${hubRadius - 2}px`,
              transform: `rotate(${angle}deg)`,
              borderRadius: 2,
            }}
          />
        ))}

        {/* Center spindle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#888',
            border: '1px solid #999',
          }}
        />
      </div>
    </div>
  );
}
