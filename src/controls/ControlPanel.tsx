import { FileUpload } from './FileUpload';
import { TransportControls } from './TransportControls';
import { VolumeSlider } from './VolumeSlider';
import { StyleSelector } from './StyleSelector';
import { AlbumArtControls } from './AlbumArtControls';
import { RecordButton } from './RecordButton';
import { ExportControls } from './ExportControls';

export function ControlPanel() {
  return (
    <div
      className="flex flex-col items-center rounded-xl bg-neutral-900/80 border border-neutral-800"
      style={{ padding: '24px 24px 40px', gap: 24 }}
    >
      <FileUpload />
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <TransportControls />
        <div className="w-px h-5 bg-neutral-700" />
        <VolumeSlider />
        <div className="w-px h-5 bg-neutral-700" />
        <StyleSelector />
        <div className="w-px h-5 bg-neutral-700" />
        <AlbumArtControls />
        <div className="w-px h-5 bg-neutral-700" />
        <RecordButton />
        <ExportControls />
      </div>
    </div>
  );
}
