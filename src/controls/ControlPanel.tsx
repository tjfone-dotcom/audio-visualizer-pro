import { FileUpload } from './FileUpload';
import { TransportControls } from './TransportControls';
import { VolumeSlider } from './VolumeSlider';

export function ControlPanel() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
      <FileUpload />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <TransportControls />
        <VolumeSlider />
      </div>
    </div>
  );
}
