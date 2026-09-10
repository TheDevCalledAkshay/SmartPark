import mongoose from 'mongoose';

const parkingLotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, default: 'Phagwara' },
    // GeoJSON point → enables "find lots near me" queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    totalSlots: { type: Number, required: true, min: 1 },
    pricePerHour: { type: Number, required: true, min: 0 },
    // Where occupancy data comes from — ties into the satellite/camera vision module
    source: {
      type: String,
      enum: ['camera', 'satellite', 'sensor', 'manual'],
      default: 'camera',
    },
    isOpen: { type: Boolean, default: true },
    openHours: { type: String, default: '24/7' },
  },
  { timestamps: true }
);

parkingLotSchema.index({ location: '2dsphere' });

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);
export default ParkingLot;
