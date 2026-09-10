import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openDirections } from '../utils/directions.js';
import { getSocket } from '../socket.js';

const SOURCE_LABELS = {
  camera: '📷 Camera',
  satellite: '🛰️ Satellite',
  sensor: '📡 Sensor',
  manual: '✍️ Manual',
};

export default function LotPanel({ lot, onBack, onPickSpot }) {
  const [spots, setSpots] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const data = await api(`/api/lots/${lot._id}/spots`);
      setSpots(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000); // keep spot statuses fresh
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lot._id]);

  // Real-time: apply spot status changes pushed by the server (Socket.IO)
  useEffect(() => {
    const s = getSocket();
    const handler = (changes) => {
      const relevant = changes.filter((c) => String(c.lot) === String(lot._id));
      if (!relevant.length) return;
      setSpots((prev) =>
        prev?.map((sp) => {
          const ch = relevant.find((c) => c._id === sp._id);
          return ch
            ? {
                ...sp,
                status: ch.status,
                detectedBy: ch.detectedBy ?? sp.detectedBy,
              }
            : sp;
        })
      );
    };
    s.on('spot-update', handler);
    return () => s.off('spot-update', handler);
  }, [lot._id]);

  const free = spots ? spots.filter((s) => s.status === 'available').length : 0;

  return (
    <div className="lot-panel">
      <button type="button" className="btn ghost back" onClick={onBack}>
        ← All lots
      </button>

      <h2>{lot.name}</h2>
      <p className="lot-address">{lot.address}</p>

      <div className="lot-panel-meta">
        <span className="badge">{SOURCE_LABELS[lot.source] ?? lot.source}</span>
        <span className="price">₹{lot.pricePerHour}/hr</span>
        <span>
          {free} of {spots?.length ?? '?'} free
        </span>
      </div>

      <button type="button" className="btn primary wide" onClick={() => openDirections(lot)}>
        🧭 Get Directions
      </button>

      <h3 className="grid-title">Spots — tap a green one to book</h3>
      {error && <p className="auth-error">{error}</p>}
      {!spots && !error && <p className="muted">Loading spots…</p>}

      <div className="spot-grid">
        {spots?.map((spot) => (
          <button
            key={spot._id}
            type="button"
            disabled={spot.status !== 'available'}
            className={`spot ${spot.status}`}
            title={`${spot.code} · ${spot.status}${spot.type !== 'car' ? ` · ${spot.type}` : ''}`}
            onClick={() => onPickSpot(spot)}
          >
            {spot.code}
            {spot.type === 'ev' && ' ⚡'}
            {spot.type === 'accessible' && ' ♿'}
          </button>
        ))}
      </div>

      <div className="legend">
        <span><i className="dot available" /> available</span>
        <span><i className="dot reserved" /> reserved</span>
        <span><i className="dot occupied" /> occupied</span>
        <span><i className="dot maintenance" /> maintenance</span>
      </div>
    </div>
  );
}
