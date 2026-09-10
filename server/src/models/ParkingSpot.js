import mongoose from 'mongoose';

const parkingSpotSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
      index: true,
    },
    code: { type: String, required: true }, // e.g. "A-01"
    level: { type: Number, default: 0 }, // floor level, 0 = ground
    type: {
      type: String,
      enum: ['car', 'bike', 'ev', 'accessible'],
      default: 'car',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
      index: true,
    },
    lastStatusUpdate: { type: Date, default: Date.now },
    // Which vision module detected the last status (camera / satellite / sensor)
    detectedBy: {
      type: String,
      enum: ['camera', 'satellite', 'sensor', 'manual', null],
      default: null,
    },
  },
  { timestamps: true }
);

// One spot with a given code per lot
parkingSpotSchema.index({ lot: 1, code: 1 }, { unique: true });
// Fast lookups: all available spots in a lot
parkingSpotSchema.index({ lot: 1, status: 1 });

const ParkingSpot = mongoose.model('ParkingSpot', parkingSpotSchema);
export default ParkingSpot;
