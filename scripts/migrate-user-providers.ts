/**
 * Migration script to add provider field to existing users
 * Run this script once after deploying the provider field changes
 */

import connectDB from '../lib/mongodb';
import User from '../lib/models/User';

async function migrateUserProviders() {
  try {
    await connectDB();
    
    console.log('🔄 Starting user provider migration...');
    
    // Find all users without a provider field
    const usersWithoutProvider = await User.find({ 
      provider: { $exists: false } 
    });
    
    console.log(`Found ${usersWithoutProvider.length} users without provider field`);
    
    let credentialsCount = 0;
    let oauthCount = 0;
    
    for (const user of usersWithoutProvider) {
      let provider = 'credentials'; // default
      
      if (user.password) {
        // User has password = registered with email/password
        provider = 'credentials';
        credentialsCount++;
      } else {
        // User has no password = registered with OAuth
        // Since we can't determine which OAuth provider, default to 'google'
        // You might want to manually review these or ask users to re-authenticate
        provider = 'google'; // or 'github' - choose based on your primary OAuth provider
        oauthCount++;
      }
      
      await User.findByIdAndUpdate(user._id, { provider });
      console.log(`✅ Updated user ${user.email} with provider: ${provider}`);
    }
    
    console.log('🎉 Migration completed!');
    console.log(`- ${credentialsCount} users set to 'credentials'`);
    console.log(`- ${oauthCount} users set to 'google' (manual review recommended)`);
    
    // Verify migration
    const providerStats = await User.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 Final provider distribution:');
    providerStats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count} users`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  migrateUserProviders();
}

export default migrateUserProviders;
