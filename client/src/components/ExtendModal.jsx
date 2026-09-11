import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const QUARTERS = [1, 2, 3, 4, 6, 8]; // 15, 30, 45, 60, 90, 120 min

export default function ExtendModal({ booking, onClose, onExtended }) {
  const [quarters, setQuarters] = useState(2);
  const [queue, setQueue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const lot = booking.lot || {};
  const ratePerQuarter = (lot.pricePerHour || 0) / 4;
  const extraAmount = Math.round(quarters * ratePerQuarter);
  const extraMinutes = quarters * 15;
  const newEnd = useMemo(
    () => new Date(new Date(booking.endTime).getTime() + extraMinutes * 60_000),
    [booking.endTime, extraMinutes]
  );

  // Fetch queue pressure on open
  useEffect(() => {
    api(`/api/bookings/${booking._id}/queue`)
      .then(setQueue)
      .catch(() => setQueue({ queueCount: 0, message: '' }));
  }, [booking._id]);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await api(`/api/bookings/${booking._id}`, {
        method: 'PUT',
        body: { quarters: Number(quarters) },
      });
      setSuccess(true);
      setTimeout(() => {
        onExtended?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal extend-modal">
        {success ? (
          <div className="paying">
            <div className="spinner" />
            <p>Slot extended successfully!</p>
            <p className="muted">+{extraMinutes} min · ₹{extraAmount} charged</p>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <h2>Extend your slot</h2>
              <button type="button" className="x" onClick={onClose}>✕</button>
            </div>

            <p className="muted">
              {lot.name} · spot {booking.spot?.code} · {booking.bookingCode}
            </p>

            {/* Queue pressure banner */}
            {queue && queue.queueCount > 0 && (
              <div className="queue-warning">
                ⚠️ {queue.message}
              </div>
            )}

            <label>
              Extra time
              <div className="quarter-options">
                {QUARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`quarter-btn ${quarters === q ? 'selected' : ''}`}
                    onClick={() => setQuarters(q)}
                  >
                    +{q * 15}m
                  </button>
                ))}
              </div>
            </label>

            <div className="extend-summary">
              <div className="extend-row">
                <span>Additional cost</span>
                <strong>₹{extraAmount}</strong>
              </div>
              <div className="extend-row">
                <span>New end time</span>
                <strong>{newEnd.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="button" className="btn primary wide" onClick={confirm} disabled={busy}>
              {busy ? 'Processing payment…' : `Pay ₹${extraAmount} (demo UPI)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
