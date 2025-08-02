const crypto = require('crypto');

// Generate a 64-character hex secret for NextAuth
const secret = crypto.randomBytes(32).toString('hex');

console.log('🔐 ComplianceTracker Setup');
console.log('========================');
console.log('Generated NextAuth Secret:');
console.log('NEXTAUTH_SECRET=' + secret);
console.log('\n📝 Copy this line to your .env file');
console.log('⚠️  Keep this secret secure and never commit it to version control!');
