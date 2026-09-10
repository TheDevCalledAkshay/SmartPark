// Opens Google Maps driving directions to a lot.
// Tries to use the device's current location as the origin.
export function openDirections(lot) {
  if (!lot?.location?.coordinates) return;
  const [lng, lat] = lot.location.coordinates;
  const destination = `${lat},${lng}`;

  if (!navigator.geolocation) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
      '_blank'
    );
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
        '_blank'
      );
    },
    () => {
      // Location denied/unavailable — Google Maps will pick up the location itself
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
        '_blank'
      );
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}
