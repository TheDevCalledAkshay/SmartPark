import { Router } from 'express';
import Booking from '../models/Booking.js';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth); // every booking endpoint needs a logged-in user

function makeBookingCode() {
  // Unambiguous characters only (no 0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return 'SP-' + Array.from({ length: 6 }, pick).join('');
}

async function populateBooking(booking) {
  return booking.populate([
    { path: 'lot', select: 'name address location pricePerHour source' },
    { path: 'spot', select: 'code level' },
  ]);
}

// POST /api/bookings — reserve a spot (spot is held immediately)
router.post('/', async (req, res) => {
  try {
    const { lotId, spotId, startTime, durationHours, vehicleNumber, phone } =
      req.body ?? {};
    const hours = Number(durationHours);

    if (!lotId || !spotId || !startTime || !Number.isInteger(hours) || hours < 1 || hours > 24) {
      return res.status(400).json({
        message: 'lotId, spotId, startTime and durationHours (1-24) are required',
      });
    }
    if (!vehicleNumber || !String(vehicleNumber).trim()) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const lot = await ParkingLot.findById(lotId);
    if (!lot) return res.status(404).json({ message: 'Parking lot not found' });

    const spot = await ParkingSpot.findOne({ _id: spotId, lot: lotId });
    if (!spot) return res.status(404).json({ message: 'Spot not found in this lot' });
    if (spot.status !== 'available') {
      return res
        .status(409)
        .json({ message: `Spot ${spot.code} is no longer available` });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: 'Account not found' });

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start time' });
    }
    const end = new Date(start.getTime() + hours * 3600_000);

    const booking = await Booking.create({
      user: user._id,
      userName: user.name,
      phone: phone ?? user.phone ?? '',
      vehicleNumber: String(vehicleNumber).trim(),
      lot: lot._id,
      spot: spot._id,
      startTime: start,
      endTime: end,
      status: 'reserved',
      amount: hours * lot.pricePerHour, // price computed on the server, never trusted from client
      paymentStatus: 'pending',
      bookingCode: makeBookingCode(),
    });

    spot.status = 'reserved';
    spot.lastStatusUpdate = new Date();
    await spot.save();

    res.status(201).json(await populateBooking(booking));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings — my bookings (newest first)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(await Promise.all(bookings.map(populateBooking)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings/:id/pay — demo payment gateway
router.post('/:id/pay', async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(409).json({ message: 'This booking was cancelled' });
    }
    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'paid';
      await booking.save();
    }
    res.json(await populateBooking(booking));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings/:id/cancel — frees the spot again
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!['reserved', 'active'].includes(booking.status)) {
      return res
        .status(409)
        .json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status = 'cancelled';
    await booking.save();

    const spot = await ParkingSpot.findById(booking.spot);
    if (spot && spot.status === 'reserved') {
      spot.status = 'available';
      spot.lastStatusUpdate = new Date();
      await spot.save();
    }

    res.json(await populateBooking(booking));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
