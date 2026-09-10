import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openDirections } from '../utils/directions.js';

export default function MyBookings({ onClose, onChanged }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setBookings(await api('/api/bookings'));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    try {
      await api(`/api/bookings/${id}/cancel`, { method: 'POST' });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal bookings-modal">
        <div className="modal-head">
          <h2>🎟️ My Bookings</h2>
          <button type="button" className="x" onClick={onClose}>✕</button>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {!bookings && !error && <p className="muted">Loading…</p>}
        {bookings?.length === 0 && (
          <p className="muted">No bookings yet — tap a green spot on any lot and book it!</p>
        )}

        <div className="booking-list">
          {bookings?.map((b) => (
            <div key={b._id} className="booking-item">
              <div className="booking-top">
                <strong>{b.bookingCode}</strong>
                <span
                  className={`chip ${
                    b.status === 'cancelled'
                      ? 'off'
                      : b.paymentStatus === 'paid'
                        ? 'on'
                        : 'pend'
                  }`}
                >
                  {b.status === 'cancelled'
                    ? 'cancelled'
                    : b.paymentStatus === 'paid'
                      ? 'paid'
                      : 'payment pending'}
                </span>
              </div>
              <p>
                {b.lot?.name} · spot {b.spot?.code}
              </p>
              <p className="muted">
                {new Date(b.startTime).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                → {new Date(b.endTime).toLocaleString([], { timeStyle: 'short' })}
              </p>
              <div className="booking-actions">
                <span className="price">₹{b.amount}</span>
                <div>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => openDirections(b.lot)}
                  >
                    🧭 Directions
                  </button>
                  {['reserved', 'active'].includes(b.status) && (
                    <button
                      type="button"
                      className="btn small danger"
                      onClick={() => cancel(b._id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
