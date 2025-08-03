import mongoose from 'mongoose';

/**
 * Ensure all Mongoose models are registered
 * This prevents "Schema hasn't been registered" errors in serverless environments
 */
export async function ensureModelsRegistered() {
  try {
    // Import all models to ensure they're registered
    await import('./models/User');
    await import('./models/Organization');
    await import('./models/Task');
    await import('./models/Document');
    
    console.log('All models registered successfully');
  } catch (error) {
    console.error('Error registering models:', error);
  }
}

/**
 * Get a model safely, registering it if necessary
 */
export function getModel<T = any>(modelName: string): mongoose.Model<T> {
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  
  // Try to import and register the model
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
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }
  
  return mongoose.models[modelName];
}