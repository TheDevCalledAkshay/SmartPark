import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('PASTE_YOUR')) {
    console.error(
      '\n❌ MongoDB connection string missing!\n' +
        '   1. Open server/.env\n' +
        '   2. Set MONGODB_URI to your MongoDB Atlas connection string\n' +
        '   3. Replace <password> with your real database password\n'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: 'smartpark' });
    console.log(
      `✅ MongoDB connected → ${mongoose.connection.host} (db: ${mongoose.connection.name})`
    );
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`⚠️  MongoDB runtime error: ${err.message}`);
  });
}
