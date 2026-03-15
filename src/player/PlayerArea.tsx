import { useAppState } from '../state/AppContext';
import { TurntablePlayer } from './TurntablePlayer';
import { CDPlayer } from './CDPlayer';
import { CassettePlayer } from './CassettePlayer';
import './playerAnimations.css';

/**
 * PlayerArea - Container that mounts the selected player style.
 * Manages style switching by triggering closing animation before switching.
 */
export function PlayerArea() {
  const { state } = useAppState();
  const { playerStyle } = state;

  return (
    <div className="player-container">
      {playerStyle === 'turntable' && <TurntablePlayer />}
      {playerStyle === 'cd' && <CDPlayer />}
      {playerStyle === 'cassette' && <CassettePlayer />}
    </div>
  );
}
