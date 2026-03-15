import { useEffect, useRef, useState } from 'react';
import { VISUALIZATION_WIDTH, VISUALIZATION_HEIGHT, MIN_VIEWPORT_WIDTH } from '../types/visualizer';
import { ConsoleCanvas } from '../console/ConsoleCanvas';

function PlayerArea() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 640, height: 720, background: '#111' }}
    >
      <span className="text-neutral-600 font-mono text-sm select-none">
        Player Area
      </span>
    </div>
  );
}

export function VisualizationArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
        }}
      >
        <PlayerArea />
        <ConsoleCanvas />
      </div>
    </div>
  );
}
