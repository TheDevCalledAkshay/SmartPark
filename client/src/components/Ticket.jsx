export default function Ticket({ booking, onClose }) {
  const lot = booking.lot ?? {};
  const spot = booking.spot ?? {};
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  return (
    <div>
      <div className="ticket-head">
        <h2>✅ Booking confirmed</h2>
        <p className="muted">
          {booking.paymentStatus === 'paid'
            ? 'Payment received — show this code at the gate'
            : 'Payment pending'}
        </p>
      </div>

      <div className="ticket-code">{booking.bookingCode}</div>

      <div className="ticket-body">
        <div className="ticket-row"><span>Lot</span><strong>{lot.name}</strong></div>
        <div className="ticket-row"><span>Spot</span><strong>{spot.code}</strong></div>
        <div className="ticket-row">
          <span>From</span>
          <strong>{start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
        </div>
        <div className="ticket-row">
          <span>Until</span>
          <strong>{end.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
        </div>
        <div className="ticket-row"><span>Vehicle</span><strong>{booking.vehicleNumber}</strong></div>
        <div className="ticket-row"><span>Paid</span><strong>₹{booking.amount}</strong></div>
      </div>

      <div className="ticket-actions">
        <button type="button" className="btn primary wide" onClick={() => openDirections(lot)}>
          🧭 Get Directions
        </button>
        <button type="button" className="btn ghost wide" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
