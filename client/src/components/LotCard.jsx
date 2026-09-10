const SOURCE_LABELS = {
  camera: '📷 Camera',
  satellite: '🛰️ Satellite',
  sensor: '📡 Sensor',
  manual: '✍️ Manual',
};

export default function LotCard({ lot, active, onClick }) {
  const a = lot.availability ?? { available: 0, total: 0 };
  const pct = a.total ? Math.round((a.available / a.total) * 100) : 0;
  const level = pct > 40 ? 'good' : pct > 15 ? 'mid' : 'low';

  return (
    <button type="button" className={`lot-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="lot-head">
        <h3>{lot.name}</h3>
        <span className="badge">{SOURCE_LABELS[lot.source] ?? lot.source}</span>
      </div>
      <p className="lot-address">{lot.address}</p>
      <div className="lot-meta">
        <span className="price">₹{lot.pricePerHour}/hr</span>
        <span className={`free ${level}`}>{a.available} free</span>
      </div>
      <div className="bar">
        <div className={`bar-fill ${level}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="lot-sub">
        {a.available} of {a.total} spots available
      </p>
    </button>
  );
}
