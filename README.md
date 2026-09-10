# 🅿️ SmartPark — Real-Time Smart Parking Platform (SIH 2026)

Find, reserve and arrive at the right parking spot — without the circling.

SmartPark shows **live parking availability** around LPU/Phagwara (Punjab),
lets drivers **book & pay** for a spot in advance, generates a **gate ticket**,
and gives **turn-by-turn directions** — while a real-time engine keeps every
screen in sync.

## ✨ Features
- 🔐 Login / register with JWT sessions
- 🗺️ Live availability map (Leaflet + OpenStreetMap) with color-coded lots
- 🅿️ Spot-level grid — tap a green spot to book instantly
- 💳 Demo UPI payment flow + gate ticket with booking code
- 🧭 Google Maps directions from your current location
- ⚡ Real-time updates via Socket.IO (occupancy simulator = stand-in for the camera/satellite vision module)
- 🎟️ My Bookings — history, cancel, directions
- 🌗 Light/dark theme

## 🏗️ Tech Stack
React 19 (Vite) · Node.js + Express · MongoDB Atlas (Mongoose) · Socket.IO ·
Leaflet · JWT + bcrypt · React Router

## 🚀 Run locally
... (npm start / env setup instructions)

## 🔌 API
GET /api/health · GET /api/lots · GET /api/lots/near ·
POST /api/auth/register|login · POST /api/bookings · POST /api/bookings/:id/pay ...
