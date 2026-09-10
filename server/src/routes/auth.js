import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function toAuthPayload(user) {
  return {
    token: jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: '7d',
    }),
    user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body ?? {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      phone: phone ?? '',
    });

    res.status(201).json(toAuthPayload(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json(toAuthPayload(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — who am I logged in as?
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email phone');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
