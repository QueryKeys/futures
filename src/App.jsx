import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Sidebar, MobileTopBar } from './components/Sidebar.jsx';
import { Home } from './pages/Home.jsx';
import { MarketScanner } from './pages/MarketScanner.jsx';
import { AllEvents } from './pages/AllEvents.jsx';
import { SharksRadar } from './pages/SharksRadar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg text-text">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <MobileTopBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={<MarketScanner />} />
            <Route path="/events" element={<AllEvents />} />
            <Route path="/sharks" element={<SharksRadar />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
