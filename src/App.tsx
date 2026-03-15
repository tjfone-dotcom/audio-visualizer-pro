import { AppProvider } from './state/AppContext';
import { Layout } from './ui/Layout';
import { ControlPanel } from './controls/ControlPanel';

export default function App() {
  return (
    <AppProvider>
      <Layout controls={<ControlPanel />} />
    </AppProvider>
  );
}
