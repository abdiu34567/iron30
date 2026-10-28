import mongoose from 'mongoose';

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/iron30';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
    });

    return conn;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB at:', mongoUri);
    console.error(error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}
