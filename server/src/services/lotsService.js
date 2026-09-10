import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';

// Aggregates spot counts per lot, grouped by status
export async function getAvailabilityMap() {
  const counts = await ParkingSpot.aggregate([
    { $group: { _id: { lot: '$lot', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const map = new Map();
  for (const c of counts) {
    const key = c._id.lot.toString();
    if (!map.has(key)) {
      map.set(key, { available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 });
    }
    const entry = map.get(key);
    entry[c._id.status] = c.count;
    entry.total += c.count;
  }
  return map;
}

export function withAvailability(lots, map) {
  const empty = { available: 0, occupied: 0, reserved: 0, maintenance: 0, total: 0 };
  return lots.map((lot) => ({
    ...lot,
    availability: map.get(lot._id.toString()) ?? empty,
  }));
}

// All lots + live availability — used by the API and the realtime simulator
export async function getLotsWithAvailability() {
  const lots = await ParkingLot.find().sort({ name: 1 }).lean();
  const map = await getAvailabilityMap();
  return withAvailability(lots, map);
}
