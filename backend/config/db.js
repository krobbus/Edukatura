import mongoose from 'mongoose';

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not set in environment variables');
        }

        await mongoose.connect(uri);
        console.log('Successfully connected');
    } catch (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    }
}

export default connectDB;