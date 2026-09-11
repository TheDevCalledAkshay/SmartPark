import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { openDirections } from '../utils/directions.js';
import ExtendModal from './ExtendModal.jsx';

export default function MyBookings({ onClose, onChanged }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [refundMsg, setRefundMsg] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second so countdowns stay live
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
      const booking = bookings.find((b) => b._id === id);
      await api(`/api/bookings/${id}/cancel`, { method: 'POST' });
      await load();
      onChanged?.();
      // Show a non-blocking refund confirmation for 4 seconds
      setRefundMsg(
        booking
          ? `Refund of ₹${booking.amount} has been initiated for ${booking.bookingCode}. It will reflect in 5–7 business days.`
          : 'Refund has been initiated.'
      );
      setTimeout(() => setRefundMsg(null), 4000);
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
        {refundMsg && <p className="refund-msg">✅ {refundMsg}</p>}
        {!bookings && !error && <p className="muted">Loading…</p>}
        {bookings?.length === 0 && (
          <p className="muted">No bookings yet — tap a green spot on any lot and book it!</p>
        )}

        <div className="booking-list">
          {bookings?.map((b) => {
            const endMs = new Date(b.endTime).getTime();
            const remainingMs = endMs - now;
            const isUrgent = remainingMs > 0 && remainingMs <= 15 * 60_000;
            const isExpired = remainingMs <= 0;
            const active = ['reserved', 'active'].includes(b.status);

            let timerText = '';
            let timerClass = 'timer';
            if (!active || isExpired) {
              timerText = b.status === 'cancelled' ? 'Cancelled' : 'Expired';
              timerClass += ' timer-done';
            } else if (isUrgent) {
              const m = Math.floor(remainingMs / 60000);
              const s = Math.floor((remainingMs % 60000) / 1000);
              timerText = `${m}m ${String(s).padStart(2, '0')}s left`;
              timerClass += ' timer-urgent';
            } else {
              const h = Math.floor(remainingMs / 3600_000);
              const m = Math.floor((remainingMs % 3600_000) / 60000);
              timerText = `${h}h ${m}m left`;
              timerClass += ' timer-ok';
            }

            return (
              <div key={b._id} className={`booking-item ${isUrgent ? 'booking-urgent' : ''}`}>
                <div className="booking-top">
                  <strong>{b.bookingCode}</strong>
                  <span className={`chip ${
                    b.status === 'cancelled' ? 'off' : b.paymentStatus === 'paid' ? 'on' : 'pend'
                  }`}>
                    {b.status === 'cancelled'
                      ? 'cancelled'
                      : b.paymentStatus === 'paid'
                        ? 'paid'
                        : 'payment pending'}
                  </span>
                </div>
                <p>{b.lot?.name} · spot {b.spot?.code}</p>
                <p className="muted">
                  {new Date(b.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  {' → '}
                  {new Date(b.endTime).toLocaleString([], { timeStyle: 'short' })}
                </p>

                {/* Live countdown */}
                <span className={timerClass}>{timerText}</span>

                {/* Email reminder sent indicator */}
                {b.extendWarningSent && active && !isExpired && (
                  <p className="email-sent">📧 Reminder sent to your email</p>
                )}

                {/* Urgent: extend CTA */}
                {isUrgent && active && !isExpired && (
                  <div className="urgent-extend">
                    <span>⚠️ Your slot ends soon — other drivers are waiting!</span>
                  </div>
                )}

                <div className="booking-actions">
                  <span className="price">₹{b.amount}</span>
                  <div>
                    <button type="button" className="btn small" onClick={() => openDirections(b.lot)}>
                      🧭 Directions
                    </button>
                    {active && !isExpired && (
                      <button
                        type="button"
                        className="btn small extend"
                        onClick={() => setExtendTarget(b)}
                      >
                        Extend +
                      </button>
                    )}
                    {['reserved', 'active'].includes(b.status) && (
                      <button type="button" className="btn small danger" onClick={() => cancel(b._id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {extendTarget && (
        <ExtendModal
          booking={extendTarget}
          onClose={() => setExtendTarget(null)}
          onExtended={() => {
            load();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
