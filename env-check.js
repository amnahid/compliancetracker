// Environment Validation Script
// Run this to check all required environment variables

const requiredEnvVars = {
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB,
  
  // NextAuth Configuration
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Email Configuration
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL,
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};

const optionalEnvVars = {
  // Optional Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

console.log('🔍 Environment Variable Validation Report');
console.log('==========================================\n');

// Check required variables
console.log('📋 Required Environment Variables:');
let missingRequired = [];
let configuredRequired = [];

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value || value.trim() === '') {
    missingRequired.push(key);
    console.log(`❌ ${key}: MISSING`);
  } else {
    configuredRequired.push(key);
    console.log(`✅ ${key}: CONFIGURED`);
  }
});

console.log('\n📋 Optional Environment Variables:');
let configuredOptional = [];
let missingOptional = [];

Object.entries(optionalEnvVars).forEach(([key, value]) => {
  if (!value || value.trim() === '') {
    missingOptional.push(key);
    console.log(`⚠️  ${key}: NOT SET (optional)`);
  } else {
    configuredOptional.push(key);
    console.log(`✅ ${key}: CONFIGURED`);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Required variables configured: ${configuredRequired.length}/${Object.keys(requiredEnvVars).length}`);
console.log(`⚠️  Optional variables configured: ${configuredOptional.length}/${Object.keys(optionalEnvVars).length}`);

if (missingRequired.length > 0) {
  console.log('\n❌ Missing Required Variables:');
  missingRequired.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n🔧 Action Required: Add these variables to your .env file');
} else {
  console.log('\n🎉 All required environment variables are configured!');
}

if (missingOptional.length > 0) {
  console.log('\n⚠️  Optional Variables Not Set:');
  missingOptional.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n💡 These are optional but may limit functionality');
}

console.log('\n==========================================');

// Export for programmatic use
module.exports = {
  requiredEnvVars,
  optionalEnvVars,
  missingRequired,
  configuredRequired,
  missingOptional,
  configuredOptional,
  isComplete: missingRequired.length === 0
};
