import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

function markerColor(availability) {
  if (!availability || !availability.total) return '#6b7280'; // gray = no data
  const ratio = availability.available / availability.total;
  if (ratio > 0.4) return '#22c55e'; // green = plenty of space
  if (ratio > 0.15) return '#f59e0b'; // amber = filling up
  return '#ef4444'; // red = almost full
}

function popupHtml(lot) {
  const a = lot.availability ?? { available: 0, total: 0 };
  return `
    <div class="sp-popup">
      <strong>${lot.name}</strong>
      <p>${lot.address}</p>
      <p><b>${a.available}</b> of ${a.total} spots free · ₹${lot.pricePerHour}/hr</p>
      <button type="button" class="sp-popup-btn" data-lotid="${lot._id}">🧭 Get Directions</button>
    </div>
  `;
}

export default function MapView({ lots, activeLotId, onDirections }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const directionsRef = useRef(onDirections);
  const [locating, setLocating] = useState(false);

  // Always call the latest onDirections without re-running effects
  directionsRef.current = onDirections;

  // Create the Leaflet map once
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [31.2536, 75.7033], // LPU, Phagwara, Punjab
      zoom: 14,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;

    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rebuild lot markers whenever data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current.values()) marker.remove();
    markersRef.current.clear();

    for (const lot of lots) {
      if (!lot.location?.coordinates) continue;
      const [lng, lat] = lot.location.coordinates;
      const color = markerColor(lot.availability);
      const icon = L.divIcon({
        className: 'sp-marker-wrapper',
        html: `<div class="sp-marker" style="--pin-color:${color}">${lot.availability?.available ?? 0}</div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.bindPopup(popupHtml(lot));
      marker.on('popupopen', (e) => {
        const btn = e.popup.getElement()?.querySelector('[data-lotid]');
        btn?.addEventListener('click', () => directionsRef.current?.(lot));
      });
      markersRef.current.set(lot._id, marker);
    }
  }, [lots]);

  // Fly to the lot selected in the sidebar
  useEffect(() => {
    const marker = activeLotId ? markersRef.current.get(activeLotId) : null;
    if (marker && mapRef.current) {
      mapRef.current.flyTo(marker.getLatLng(), 15, { duration: 0.8 });
      setTimeout(() => marker.openPopup(), 850);
    }
  }, [activeLotId]);

  function locateMe() {
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'sp-user-wrapper',
            html: '<div class="sp-user-dot"><span></span></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        }).addTo(map);
        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
      },
      () => {
        setLocating(false);
        alert('Could not get your location. Allow location access in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="map-wrap">
      <div className="map-panel" ref={containerRef} />
      <div className="map-controls">
        <button type="button" className="btn map-btn" onClick={locateMe} disabled={locating}>
          {locating ? '📍 Locating…' : '📍 Locate me'}
        </button>
      </div>
    </div>
  );
}
