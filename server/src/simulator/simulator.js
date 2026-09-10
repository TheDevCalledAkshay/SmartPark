import ParkingSpot from '../models/ParkingSpot.js';
import { broadcast } from '../realtime/io.js';
import { getLotsWithAvailability } from '../services/lotsService.js';

let timer = null;

// Sample random spots matching a filter, joined with their lot's data source
// (camera / satellite / sensor) so we can pretend the vision module detected it
async function sampleSpots(match, count) {
  if (count <= 0) return [];
  return ParkingSpot.aggregate([
    { $match: match },
    { $sample: { size: count } },
    {
      $lookup: {
        from: 'parkinglots',
        localField: 'lot',
        foreignField: '_id',
        as: 'lotDoc',
      },
    },
    { $unwind: '$lotDoc' },
    { $project: { lot: 1, code: 1, source: '$lotDoc.source' } },
  ]);
}

// One simulation tick: cars arrive & leave. 'reserved' spots (paid bookings)
// are never touched. 'maintenance' spots are left alone too.
export async function simulatorTick() {
  const rand = (n) => Math.floor(Math.random() * n);

  // Cars arriving: available → occupied
  const arrivals = await sampleSpots({ status: 'available' }, 1 + rand(2));
  for (const s of arrivals) {
    await ParkingSpot.updateOne(
      { _id: s._id },
      {
        $set: {
          status: 'occupied',
          detectedBy: s.source ?? 'sensor',
          lastStatusUpdate: new Date(),
        },
      }
    );
  }

  // Cars leaving: occupied → available
  const departures = await sampleSpots({ status: 'occupied' }, 1 + rand(2));
  for (const s of departures) {
    await ParkingSpot.updateOne(
      { _id: s._id },
      {
        $set: {
          status: 'available',
          detectedBy: s.source ?? 'sensor',
          lastStatusUpdate: new Date(),
        },
      }
    );
  }

  const changed = [
    ...arrivals.map((s) => ({
      _id: s._id,
      lot: s.lot,
      code: s.code,
      status: 'occupied',
      detectedBy: s.source ?? 'sensor',
    })),
    ...departures.map((s) => ({
      _id: s._id,
      lot: s.lot,
      code: s.code,
      status: 'available',
      detectedBy: s.source ?? 'sensor',
    })),
  ];

  if (changed.length > 0) {
    broadcast('spot-update', changed);
    broadcast('lots-update', await getLotsWithAvailability());
  }

  return changed.length;
}

export function startSimulator(intervalMs = 5000) {
  if (timer) return;
  console.log(
    `🤖 Occupancy simulator running — tick every ${intervalMs / 1000}s (cars arriving & leaving)`
  );
  timer = setInterval(() => {
    simulatorTick().catch((err) =>
      console.error('⚠️ Simulator error:', err.message)
    );
  }, intervalMs);
}

export function stopSimulator() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('🤖 Simulator stopped');
  }
}
