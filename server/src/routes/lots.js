import { Router } from 'express';
import mongoose from 'mongoose';
import ParkingLot from '../models/ParkingLot.js';
import ParkingSpot from '../models/ParkingSpot.js';
import {
  getAvailabilityMap,
  withAvailability,
  getLotsWithAvailability,
} from '../services/lotsService.js';

const router = Router();

// GET /api/lots — all lots with live availability
router.get('/', async (req, res) => {
  try {
    res.json(await getLotsWithAvailability());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/lots/near?lng=77.6&lat=12.97&radius=5000 — lots near a point
router.get('/near', async (req, res) => {
  try {
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    const radius = Number(req.query.radius) || 5000; // meters

    if (
      Number.isNaN(lng) ||
      Number.isNaN(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res.status(400).json({
        message:
          'Valid ?lng= and ?lat= query params required (lng: -180..180, lat: -90..90)',
      });
    }

    const lots = await ParkingLot.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    })
      .limit(20)
      .lean();

    const map = await getAvailabilityMap();
    res.json(withAvailability(lots, map));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/lots/:id/spots — every spot in a lot, with live status
router.get('/:id/spots', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid lot id' });
    }
    const spots = await ParkingSpot.find({ lot: id }).sort({ code: 1 }).lean();
    res.json(spots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
