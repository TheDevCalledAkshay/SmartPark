import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Ticket from './Ticket.jsx';

function localDatetimeValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const DURATIONS = [1, 2, 3, 4, 6, 8, 12, 24];

export default function BookingModal({ lot, spot, onClose, onBooked }) {
  const { user } = useAuth();
  // phases: form → paying → ticket
  const [phase, setPhase] = useState('form');
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState({
    startTime: localDatetimeValue(new Date(Date.now() + 15 * 60_000)),
    durationHours: 2,
    vehicleNumber: '',
    phone: user?.phone ?? '',
  });

  const amount = useMemo(
    () => (lot?.pricePerHour ?? 0) * Number(form.durationHours || 0),
    [lot, form.durationHours]
  );

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function pay(e) {
    e.preventDefault();
    setError(null);
    if (!form.vehicleNumber.trim()) {
      setError('Vehicle number is required');
      return;
    }

    setPhase('paying');
    try {
      // 1) Reserve the spot in the database (holds it immediately)
      const created = await api('/api/bookings', {
        method: 'POST',
        body: {
          lotId: lot._id,
          spotId: spot._id,
          startTime: new Date(form.startTime).toISOString(),
          durationHours: Number(form.durationHours),
          vehicleNumber: form.vehicleNumber,
          phone: form.phone,
        },
      });

      // 2) Simulate the payment gateway round-trip (demo mode)
      await new Promise((r) => setTimeout(r, 1800));
      const paid = await api(`/api/bookings/${created._id}/pay`, { method: 'POST' });

      setBooking(paid);
      setPhase('ticket');
      onBooked?.();
    } catch (err) {
      setError(err.message);
      setPhase('form');
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== 'paying') onClose();
      }}
    >
      <div className="modal">
        {phase === 'form' && (
          <form onSubmit={pay}>
            <div className="modal-head">
              <h2>Book spot {spot.code}</h2>
              <button type="button" className="x" onClick={onClose}>✕</button>
            </div>
            <p className="muted">{lot.name} · {lot.address}</p>

            <label>
              Start time
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={update('startTime')}
                required
              />
            </label>
            <label>
              Duration
              <select value={form.durationHours} onChange={update('durationHours')}>
                {DURATIONS.map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Vehicle number
              <input
                value={form.vehicleNumber}
                onChange={update('vehicleNumber')}
                placeholder="KA 01 AB 1234"
                required
              />
            </label>
            <label>
              Phone (optional)
              <input
                value={form.phone}
                onChange={update('phone')}
                placeholder="9876543210"
              />
            </label>

            <div className="amount-row">
              <span>₹{lot.pricePerHour} × {form.durationHours} hr</span>
              <strong>₹{amount}</strong>
            </div>

            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn primary wide">
              Pay ₹{amount} (demo UPI)
            </button>
          </form>
        )}

        {phase === 'paying' && (
          <div className="paying">
            <div className="spinner" />
            <p>Contacting payment gateway…</p>
            <p className="muted">(demo mode — no real money moves)</p>
          </div>
        )}

        {phase === 'ticket' && booking && <Ticket booking={booking} onClose={onClose} />}
      </div>
    </div>
  );
}
