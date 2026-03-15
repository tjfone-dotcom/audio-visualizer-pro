import type { ReactNode } from 'react';
import { VisualizationArea } from './VisualizationArea';

interface LayoutProps {
  controls: ReactNode;
}

export function Layout({ controls }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0a0a0a] font-sans">
      <header className="w-full py-3 px-6">
        <h1 className="text-center text-neutral-400 text-sm font-mono tracking-widest uppercase">
          Audio Visualizer Pro
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 pb-8">
        <VisualizationArea />
        <div className="w-full max-w-5xl px-4">
          {controls}
        </div>
      </main>
    </div>
  );
}
