import { Link, useNavigate } from 'react-router-dom';
import '../landing.css';

// The marketing landing page (converted from Front/index.html).
// Everything that "enters the app" navigates to /app — the real SmartPark app.
export default function LandingPage() {
  const navigate = useNavigate();
  const enterApp = () => navigate('/app');

  return (
    <div className="landing">
      <div className="app-shell">
        <header className="topbar">
          <Link className="brand" to="/" aria-label="SmartPark home">
            <span className="brand-mark">P</span>
            <span>smart<span>park</span></span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link className="nav-link active" to="/app">Explore parking</Link>
            <Link className="nav-link" to="/app">My bookings</Link>
            <a className="nav-link" href="#how-it-works">How it works</a>
          </nav>
          <div className="nav-actions">
            <Link className="operator-link" to="/app">For operators</Link>
            <button className="avatar-button" type="button" onClick={enterApp}>AR</button>
          </div>
        </header>

        <main id="top">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot"></span>Live across campus</div>
              <h1>Parking,<br /><em>without</em> the circling.</h1>
              <p>Know where you’re going before you get there. Find a spot, reserve it, and arrive with one less thing on your mind.</p>
              <div className="hero-actions">
                <Link className="button button-primary" to="/app">Find my parking <span>{'->'}</span></Link>
                <a className="button button-ghost" href="#how-it-works">See how it works <span className="play-icon">{'>'}</span></a>
              </div>
              <div className="hero-proof"><div className="proof-avatars"><span>SK</span><span>JM</span><span>DP</span><span>+</span></div><span><strong>2,400+</strong> drivers park smarter every week</span></div>
            </div>
            <div className="hero-art" role="img" aria-label="Aerial view of a connected campus parking lot">
              <div className="hero-art-glow"></div>
              <div className="arrival-card">
                <div className="arrival-card-top"><span className="live-badge"><span></span>Live availability</span><span className="small-muted">updated 30 sec ago</span></div>
                <div className="arrival-title"><span>18</span> spots near you</div>
                <div className="arrival-route"><div className="route-line"><span className="route-pin">A</span><span className="route-dash"></span><span className="route-pin teal">P</span></div><div><strong>Central Campus · North Lot</strong><small>4 min walk · from ₹20/hr</small></div></div>
                <Link className="arrival-link" to="/app">View on map <span>{'->'}</span></Link>
              </div>
              <div className="hero-tag tag-one">No searching. No stress.</div>
              <div className="hero-tag tag-two">Reservation locked</div>
            </div>
          </section>

          <section className="stats-strip" aria-label="SmartPark results">
            <div className="stat-item"><span className="stat-icon coral">12</span><div><strong>12 min</strong><span>saved per trip</span></div></div>
            <div className="stat-item"><span className="stat-icon teal">94</span><div><strong>94%</strong><span>availability accuracy</span></div></div>
            <div className="stat-item"><span className="stat-icon lime">31</span><div><strong>31%</strong><span>less circulation</span></div></div>
            <div className="stats-note">Built for campuses, communities & cities</div>
          </section>

          <section className="explore-section" id="nearby">
            <div className="section-heading"><div><div className="eyebrow dark"><span className="eyebrow-dot"></span>Good morning, Ananya</div><h2>Find your <em>better</em> spot.</h2><p>Parking near <strong>LPU Campus</strong> · Saturday, 20 September</p></div></div>
            <div className="parking-grid">
              <article className="parking-card">
                <div className="parking-thumb mint"><span className="thumb-zone">A</span><span className="thumb-count"><strong>18</strong> open</span></div>
                <div className="parking-card-body"><span className="tiny-tag">Best match</span><h3>Central Campus · North Lot</h3><p>University Avenue, Gate 2</p><div className="card-meta"><span>0.4 km</span><span>84 spaces</span><strong>₹20<small>/hr</small></strong></div><button className="card-action" type="button" onClick={enterApp}>Reserve now {'->'}</button></div>
              </article>
              <article className="parking-card">
                <div className="parking-thumb lavender"><span className="thumb-zone">B</span><span className="thumb-count"><strong>7</strong> open</span></div>
                <div className="parking-card-body"><span className="tiny-tag">Covered</span><h3>Knowledge Hub Garage</h3><p>Library Road, Basement B1</p><div className="card-meta"><span>0.8 km</span><span>46 spaces</span><strong>₹30<small>/hr</small></strong></div><button className="card-action" type="button" onClick={enterApp}>Reserve now {'->'}</button></div>
              </article>
              <article className="parking-card">
                <div className="parking-thumb peach"><span className="thumb-zone">C</span><span className="thumb-count"><strong>31</strong> open</span></div>
                <div className="parking-card-body"><span className="tiny-tag">Best value</span><h3>Residency Block Parking</h3><p>Maple Lane, Resident Entry</p><div className="card-meta"><span>1.2 km</span><span>120 spaces</span><strong>₹15<small>/hr</small></strong></div><button className="card-action" type="button" onClick={enterApp}>Reserve now {'->'}</button></div>
              </article>
            </div>
          </section>

          <section className="how-section" id="how-it-works">
            <div className="section-heading centered"><div className="eyebrow dark"><span className="eyebrow-dot"></span>Simple by design</div><h2>From search to <em>parked.</em></h2><p>Everything you need to turn a parking guess into a confident arrival.</p></div>
            <div className="steps-grid">
              <div className="step-card"><span className="step-number">01</span><h3>See what’s open</h3><p>Browse verified availability around your destination.</p></div>
              <div className="step-card"><span className="step-number">02</span><h3>Lock your spot</h3><p>Choose a compatible space and reserve in a few taps.</p></div>
              <div className="step-card"><span className="step-number">03</span><h3>Arrive with ease</h3><p>Follow directions straight to the right parking zone.</p></div>
            </div>
          </section>

          <section className="closing-cta" id="bookings">
            <div><span className="eyebrow"><span className="eyebrow-dot"></span>Make the first move</span><h2>The best parking spot<br /><em>is the one you know.</em></h2></div>
            <Link className="button button-light" to="/app">Find my parking {'->'}</Link>
          </section>
        </main>

        <footer className="site-footer">
          <Link className="brand brand-compact" to="/"><span className="brand-mark">P</span><span>smart<span>park</span></span></Link>
          <div className="footer-copy">Smart parking for the way life moves.</div>
          <div className="footer-links"><a href="#how-it-works">Support</a><span>© 2026 SmartPark</span></div>
        </footer>
      </div>
    </div>
  );
}
