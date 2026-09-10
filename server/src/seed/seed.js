import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';

// Demo lots around LPU (Lovely Professional University), Phagwara, Punjab — [longitude, latitude]
const LOTS = [
  {
    name: 'LPU Main Gate Parking',
    address: 'NH-1, Main Gate, LPU, Phagwara',
    coordinates: [75.704, 31.2568],
    totalSlots: 24,
    pricePerHour: 30,
    source: 'camera',
  },
  {
    name: 'LPU UNI Mall Parking',
    address: 'Inside Campus, near UNI Mall, LPU',
    coordinates: [75.705, 31.2495],
    totalSlots: 30,
    pricePerHour: 40,
    source: 'sensor',
  },
  {
    name: 'LPU Campus West Lot',
    address: 'Block 33-40 side, West Campus, LPU',
    coordinates: [75.7011, 31.2506],
    totalSlots: 20,
    pricePerHour: 25,
    source: 'camera',
  },
  {
    name: 'Phagwara Bus Stand Parking',
    address: 'Bus Stand Road, Phagwara',
    coordinates: [75.7722, 31.2213],
    totalSlots: 18,
    pricePerHour: 15,
    source: 'camera',
  },
  {
    name: 'Phagwara Railway Station Parking',
    address: 'Railway Station, Phagwara',
    coordinates: [75.7649, 31.2277],
    totalSlots: 26,
    pricePerHour: 15,
    source: 'sensor',
  },
  {
    name: 'Model Town Parking, Jalandhar',
    address: 'Model Town, Jalandhar',
    coordinates: [75.5796, 31.3183],
    totalSlots: 16,
    pricePerHour: 20,
    source: 'satellite',
  },
];

function randomStatus() {
  const r = Math.random();
  if (r < 0.55) return 'available';
  if (r < 0.8) return 'occupied';
  if (r < 0.92) return 'reserved';
  return 'maintenance';
}

async function seed() {
  await connectDB();

  console.log('🧹 Clearing old data...');
  await Promise.all([ParkingLot.deleteMany({}), ParkingSpot.deleteMany({})]);

  for (const def of LOTS) {
    const lot = await ParkingLot.create({
      name: def.name,
      address: def.address,
      city: 'Phagwara',
      location: { type: 'Point', coordinates: def.coordinates },
      totalSlots: def.totalSlots,
      pricePerHour: def.pricePerHour,
      source: def.source,
    });

    const spots = Array.from({ length: def.totalSlots }, (_, i) => {
      const n = i + 1;
      const row = String.fromCharCode(65 + Math.floor((n - 1) / 10)); // A, B, C...
      const type = n === 1 ? 'accessible' : n % 12 === 0 ? 'ev' : 'car';
      return {
        lot: lot._id,
        code: `${row}-${String(n).padStart(2, '0')}`,
        level: 0,
        type,
        status: randomStatus(),
        detectedBy: ['camera', 'satellite', 'sensor'].includes(def.source)
          ? def.source
          : 'manual',
      };
    });

    await ParkingSpot.insertMany(spots);
    console.log(`   🅿️  ${lot.name} — ${def.totalSlots} spots`);
  }

  const lotsCount = await ParkingLot.countDocuments();
  const spotsCount = await ParkingSpot.countDocuments();
  console.log(`\n✅ Seed complete: ${lotsCount} lots, ${spotsCount} spots`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
