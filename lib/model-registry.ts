import mongoose from 'mongoose';

// Import all models to ensure they're registered immediately
import './models/User';
import './models/Organization';
import './models/Task';
import './models/Document';
import './models/Invitation';

let isConnected = false;

/**
 * Connect to MongoDB with proper error handling
 */
export async function connectDB() {
  if (isConnected && mongoose.connections[0].readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Ensure all Mongoose models are registered
 * This prevents "Schema hasn't been registered" errors in serverless environments
 */
export function ensureModelsRegistered() {
  const requiredModels = ['User', 'Organization', 'Task', 'Document', 'Invitation'];
  
  requiredModels.forEach(modelName => {
    if (!mongoose.models[modelName]) {
      console.log(`🔄 Re-registering model: ${modelName}`);
      try {
        switch (modelName) {
          case 'User':
            require('./models/User');
            break;
          case 'Organization':
            require('./models/Organization');
            break;
          case 'Task':
            require('./models/Task');
            break;
          case 'Document':
            require('./models/Document');
            break;
          case 'Invitation':
            require('./models/Invitation');
            break;
        }
      } catch (error) {
        console.error(`❌ Error registering ${modelName}:`, error);
      }
    }
  });
  
  console.log('📝 Registered models:', Object.keys(mongoose.models));
}

/**
 * Get a model safely, registering it if necessary
 */
export function getModel<T = any>(modelName: string): mongoose.Model<T> {
  ensureModelsRegistered();
  
  if (!mongoose.models[modelName]) {
    throw new Error(`Model ${modelName} not found after registration attempt`);
  }
  
  return mongoose.models[modelName];
}