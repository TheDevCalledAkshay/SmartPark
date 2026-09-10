import { useCallback, useEffect, useMemo, useState, Component } from 'react';
import MapView from './components/MapView.jsx';
import LotCard from './components/LotCard.jsx';
import LotPanel from './components/LotPanel.jsx';
import BookingModal from './components/BookingModal.jsx';
import MyBookings from './components/MyBookings.jsx';
import AuthPage from './components/AuthPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { openDirections } from './utils/directions.js';
import { getSocket } from './socket.js';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx';
import { getTheme } from './theme.js';
import ThemeToggle from './components/ThemeToggle.jsx';

const REFRESH_MS = 10_000; // re-fetch availability every 10 seconds

function Dashboard() {
  const { user, logout } = useAuth();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [bookingSpot, setBookingSpot] = useState(null); // { lot, spot }
  const [showBookings, setShowBookings] = useState(false);
  const [live, setLive] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [theme, setThemeState] = useState(getTheme());

  const loadLots = useCallback(async () => {
    try {
      const res = await fetch('/api/lots');
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = await res.json();
      setLots(data);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Cannot reach the parking API — is the backend running? (npm start)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLots();
    const timer = setInterval(loadLots, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadLots]);

  // --- Real-time updates (Socket.IO) ---
  useEffect(() => {
    const s = getSocket();

    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);
    const onSpotUpdate = (changes) => {
      setLastUpdated(new Date());
      // Show a little live-feed toast for the first change in the batch
      const first = changes[0];
      if (first) {
        const id = `${String(first._id)}-${Date.now()}`;
        const text =
          first.status === 'occupied'
            ? `🚗 ${first.code} just filled up`
            : `🅿️ ${first.code} is now free`;
        setToasts((prev) => [...prev.slice(-2), { id, text }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
        }, 4000);
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('spot-update', onSpotUpdate);
    if (s.connected) setLive(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('spot-update', onSpotUpdate);
    };
  }, []);

  const totals = useMemo(
    () =>
      lots.reduce(
        (acc, lot) => ({
          free: acc.free + (lot.availability?.available ?? 0),
          total: acc.total + (lot.availability?.total ?? 0),
        }),
        { free: 0, total: 0 }
      ),
    [lots]
  );

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">🅿️</span>
          <div>
            <h1>SmartPark</h1>
            <p>Live parking availability · LPU · Punjab</p>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-value green">{totals.free}</span>
            <span className="stat-label">spots free</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totals.total}</span>
            <span className="stat-label">total spots</span>
          </div>
          <div className="stat">
            <span className="stat-value">{lots.length}</span>
            <span className="stat-label">parking lots</span>
          </div>
          <div className="stat">
            <span className="stat-label">
              <span className={`live-dot ${error ? 'offline' : live ? '' : 'idle'}`} />
              {error
                ? 'api offline'
                : live
                  ? `LIVE · updated ${lastUpdated?.toLocaleTimeString() ?? '…'}`
                  : lastUpdated
                    ? `polling · updated ${lastUpdated.toLocaleTimeString()}`
                    : 'connecting…'}
            </span>
          </div>
        </div>
        <div className="user-chip">
          <ThemeToggle onChange={setThemeState} />
          <button type="button" className="btn ghost small" onClick={() => setShowBookings(true)}>
            🎟️ My Bookings
          </button>
          <span className="user-name">👤 {user?.name}</span>
          <button type="button" className="btn ghost small" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <main className="layout">
        <aside className="sidebar">
          {selectedLot ? (
            <LotPanel
              lot={selectedLot}
              onBack={() => setSelectedLot(null)}
              onPickSpot={(spot) => {
                setBookingSpot({ lot: selectedLot, spot });
                setSelectedLot(null);
              }}
            />
          ) : (
            <>
              {loading && <p className="muted">Loading parking lots…</p>}
              {!loading && !error && lots.length === 0 && (
                <p className="muted">
                  No parking lots in the database. Run <code>npm run seed</code> first.
                </p>
              )}
              {lots.map((lot) => (
                <LotCard
                  key={lot._id}
                  lot={lot}
                  active={lot._id === selectedLot?._id}
                  onClick={() => setSelectedLot(lot)}
                />
              ))}
            </>
          )}
        </aside>

        <MapView
          lots={lots}
          activeLotId={selectedLot?._id ?? null}
          onDirections={(lot) => openDirections(lot)}
        />
      </main>

      {bookingSpot && (
        <BookingModal
          lot={bookingSpot.lot}
          spot={bookingSpot.spot}
          onClose={() => setBookingSpot(null)}
          onBooked={loadLots}
        />
      )}

      {showBookings && (
        <MyBookings onClose={() => setShowBookings(false)} onChanged={loadLots} />
      )}

      <div className="live-feed">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// Safety net: if any component ever crashes, show a friendly card
// instead of a blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen theme-light">
          <div className="auth-card">
            <h2>😵 Something broke</h2>
            <p className="muted" style={{ margin: '10px 0' }}>
              {String(this.state.error)}
            </p>
            <button
              type="button"
              className="btn primary wide"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// The site root: logged-out users see the auth page first;
// logged-in users see the landing page (index.html)
function RootPage() {
  const { user, checking } = useAuth();

  if (checking) {
    return (
      <div className="auth-screen theme-light">
        <p className="muted">Loading SmartPark…</p>
      </div>
    );
  }
  return user ? <LandingPage /> : <AuthPage />;
}

// Protects the dashboard route - logged-out users are asked to log in
function Gate() {
  const { user, checking } = useAuth();

  if (checking) {
    return (
      <div className="auth-screen theme-light">
        <p className="muted">Loading SmartPark...</p>
      </div>
    );
  }
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Landing page (the polished marketing site) */}
          <Route path="/" element={<RootPage />} />
          {/* The real app — login-gated dashboard */}
          <Route path="/app" element={<Gate />} />
          {/* Anything else → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
